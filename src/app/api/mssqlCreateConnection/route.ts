import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { SourceTable, TargetTable, mapping } = body;

    // Create connection pools for both databases
    const db1Pool = mysql.createPool({
      host: SourceTable.host,
      user: SourceTable.user,
      password: SourceTable.password,
      database: SourceTable.database,
    });

    const db2Pool = mysql.createPool({
      host: TargetTable.host,
      user: TargetTable.user,
      password: TargetTable.password,
      database: TargetTable.database,
    });

    // Get authors from SourceTable.tableName-author
    const [authors] = await db1Pool.execute<mysql.RowDataPacket[]>(`SELECT authorName FROM \`${SourceTable.tableName}-author\``);

    // First, insert/update users in wp_users
    const userPromises = authors.map(async (author) => {
      const authorName = author.authorName;
      const firstWordOfAuthor = authorName.split(' ')[0].toLowerCase();

      const userLogin = firstWordOfAuthor;
      const userNickname = firstWordOfAuthor;
      const displayName = authorName;
      const userRegistered = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const [existingUser] = await db2Pool.execute<mysql.RowDataPacket[]>(`SELECT ID FROM wp_users WHERE user_login = ?`, [userLogin]);
      if (existingUser.length > 0) {
        // User exists, update it
        const updateUserQuery = `
          UPDATE \`wp_users\`
          SET user_nicename = ?, display_name = ?, user_registered = ?
          WHERE user_login = ?;
        `;
        return db2Pool.execute(updateUserQuery, [userNickname, displayName, userRegistered, userLogin]);
      } else {
        // User does not exist, insert it
        const insertUserQuery = `
          INSERT INTO \`wp_users\` (user_login, user_nicename, display_name, user_registered)
          VALUES (?, ?, ?, ?);
        `;
        return db2Pool.execute(insertUserQuery, [userLogin, userNickname, displayName, userRegistered]);
      }
    });

    await Promise.all(userPromises);

    // Now, insert/update posts in wp_posts
    const [posts] = await db1Pool.execute<mysql.RowDataPacket[]>(`SELECT * FROM \`${SourceTable.tableName}-posts\``);

    const postPromises = posts.map(async (post) => {
      const postTitle = post.title;
      const postContent = post.content;
      const postType = post.postType;
      const postName = post.slug;
      const postModified = post.updatedDate;
      const postDate = post.publishedDate;
      const authorNameForPost = post.author_name;
      const postExcerpt = " ";
      const toPing = " ";
      const pinged = " ";
      const postContentFiltered = " ";

      // Get author ID from wp_users based on display_name
      const [authorResult] = await db2Pool.execute<mysql.RowDataPacket[]>(`SELECT ID FROM wp_users WHERE display_name = ?`, [authorNameForPost]);
      const postAuthor = authorResult.length > 0 ? authorResult[0].ID : null;

      if (!postAuthor) {
        // Skip this post if the author is not found
        return;
      }

      // Check if the post already exists
      const [existingPost] = await db2Pool.execute<mysql.RowDataPacket[]>(`SELECT ID FROM wp_posts WHERE post_name = ?`, [postName]);
      if (existingPost.length > 0) {
        // Post exists, update it
        const updatePostQuery = `
          UPDATE \`wp_posts\`
          SET post_content = ?, post_title = ?, post_excerpt = ?, post_modified = ?, post_date = ?, to_ping = ?, pinged = ?, post_content_filtered = ?
          WHERE post_name = ?;
        `;
        return db2Pool.execute(updatePostQuery, [postContent, postTitle, postExcerpt, postModified, postDate, toPing, pinged, postContentFiltered, postName]);
      } else {
        // Post does not exist, insert it
        const insertPostQuery = `
          INSERT INTO \`wp_posts\` (post_author, post_content, post_excerpt, post_name, post_title, post_type, post_modified, post_date, to_ping, pinged, post_content_filtered)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        return db2Pool.execute(insertPostQuery, [postAuthor, postContent, postExcerpt, postName, postTitle, postType, postModified, postDate, toPing, pinged, postContentFiltered]);
      }
    });

    await Promise.all(postPromises);

    await db1Pool.end();
    await db2Pool.end();

    return NextResponse.json({
      message: 'Data transferred successfully!',
    });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
