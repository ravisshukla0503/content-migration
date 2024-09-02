import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import mysql from "mysql2/promise";

// const BACKSLASH_REGEX = /\\/g;
// const QUOTE_REGEX = /"/g;

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const {
//       xml,
//       type,
//       onBasisOfCategory,
//       contentClass,
//       InfoClass,
//       ImageClass,
//     } = body;
//     const parsedUrl = new URL(xml);
//     const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
//     const urls = await extractUrlsFromSitemap(xml, type);
//     const blogPosts = await Promise.all(
//       //take multiple promise as input and return single promise
//       urls.map(async (url: string) => {
//         const category = extractCategoryFromUrl(url, type);
//         const title = category
//           ? await fetchTitleFromUrl(url)
//           : formatTitleFromUrl(url);
//         let splitUrlForSlug = url.split("/").filter(Boolean);
//         const slug = splitUrlForSlug[splitUrlForSlug.length - 1];

//         if (onBasisOfCategory && !category) {
//           return {
//             url,
//             title,
//             category,
//             content: null,
//             date: null,
//             author: null,
//             image: null,
//             imageAlt: null,
//             slug,
//           };
//         }

//         const { content, date, author, image, imageAlt } = await fetchPageData(
//           url,
//           contentClass,
//           InfoClass,
//           ImageClass,
//           baseUrl
//         );
//         return {
//           url,
//           title,
//           category,
//           content,
//           date,
//           author,
//           image,
//           imageAlt,
//           slug,
//         };
//       })
//     );
//     return NextResponse.json(
//       JSON.parse(JSON.stringify(blogPosts, htmlAttributeReplacer))
//     );
//   } catch (error) {
//     return NextResponse.json(
//       { error: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }


const BACKSLASH_REGEX = /\\/g;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      xml,
      type,
      onBasisOfCategory,
      contentClass,
      InfoClass,
      ImageClass,
      dbConfig, // Added for database configuration
      tableName,
    } = body;
    
    const parsedUrl = new URL(xml);
    console.log("parsedUrl", parsedUrl);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    console.log("baseUrl", baseUrl);
    const urls = await extractUrlsFromSitemap(xml, type);
    console.log("urls", urls);
    console.log("body", body);
    // Create a connection to the MySQL database
    const pool = mysql.createPool(dbConfig);
    console.log("pool", pool);

    // Create the table if it doesn't exist
    await createTableIfNotExists(pool, tableName);

    // Process each URL and insert into the database immediately
    for (const url of urls) {
      const category = extractCategoryFromUrl(url, type);
      const title = category
        ? await fetchTitleFromUrl(url)
        : formatTitleFromUrl(url);
      let splitUrlForSlug = url.split("/").filter(Boolean);
      const slug = splitUrlForSlug[splitUrlForSlug.length - 1];

      if (onBasisOfCategory && !category) {
        await upsertIntoDatabase(pool, {
          url,
          title,
          category,
          content: null,
          date: null,
          author: null,
          image: null,
          imageAlt: null,
          slug
        }, tableName);
      } else {
        const { content, date, author, image, imageAlt } = await fetchPageData(
          url,
          contentClass,
          InfoClass,
          ImageClass,
          baseUrl
        );
        await upsertIntoDatabase(pool, {
          url,
          title,
          category,
          content,
          date,
          author,
          image,
          imageAlt,
          slug
        }, tableName);
      }
    }

    await pool.end();
    return NextResponse.json({ message: "Data processed and inserted successfully" });

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function createTableIfNotExists(connection: mysql.Pool, tableName: string) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      url VARCHAR(255) UNIQUE,
      title VARCHAR(255),
      category VARCHAR(255),
      content TEXT,
      date DATETIME,
      author VARCHAR(255),
      image VARCHAR(255),
      imageAlt VARCHAR(255),
      slug VARCHAR(255)
    );
  `;
  await connection.execute(createTableQuery);
}

async function upsertIntoDatabase(connection: mysql.Pool, data: any, tableName: string) {
  // Use INSERT ... ON DUPLICATE KEY UPDATE to avoid duplicate entries
  const upsertQuery = `
    INSERT INTO ${tableName}
    (url, title, category, content, date, author, image, imageAlt, slug) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      category = VALUES(category),
      content = VALUES(content),
      date = VALUES(date),
      author = VALUES(author),
      image = VALUES(image),
      imageAlt = VALUES(imageAlt),
      slug = VALUES(slug);
  `;
  await connection.execute(upsertQuery, [
    data.url,
    data.title,
    data.category,
    data.content,
    data.date,
    data.author,
    data.image,
    data.imageAlt,
    data.slug
  ]);
}

async function fetchPageData(
    url: string,
    contentClass: string,
    infoClass: string,
    imageClass: string,
    baseUrl: string
  ) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
  
      const data = await response.text();
      const $ = cheerio.load(data);
  
      const contentInnerHtml = $(`.${contentClass}`);
  
      contentInnerHtml.find("img").each((_, img) => {
        let src = $(img).attr("src");
  
        if (src && !src.startsWith("http")) {
          src = src.replace(BACKSLASH_REGEX, "");
          $(img).attr("src", baseUrl + src);
        }
      });
  
      const content = contentInnerHtml.html();
      const dateElement = $(`.${infoClass} div`).eq(0).text().trim();
      const formattedDate = dateElement ? formatDate(dateElement) : null;
      const authorElement = $(`.${infoClass} div`).eq(2).text().trim();
  
      let imageUrl = $(`.${imageClass} img`).attr("src") || "";
      imageUrl = imageUrl.startsWith("/") ? baseUrl + imageUrl : imageUrl;
      const imageAlt = $(`.${imageClass} img`).attr("alt") || "";
  
      return {
        content,
        date: formattedDate,
        author: authorElement,
        image: imageUrl,
        imageAlt: imageAlt,
      };
    } catch (error: any) {
      console.error(`Error fetching data from ${url}:`, error.message);
      return {
        content: null,
        date: null,
        author: null,
        image: null,
        imageAlt: null,
      };
    }
  }
  
  async function extractUrlsFromSitemap(
    xml: string,
    type: string
  ): Promise<string[]> {
    const response = await fetch(xml);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    const data = await response.text();
    const parsedSitemap = await parseStringPromise(data);
  
    return parsedSitemap.urlset.url
      .map((entry: any) => entry.loc[0])
      .filter((url: string) => url.includes(type));
  }
  
  function extractCategoryFromUrl(url: string, type: string): string {
    const segments = url.split("/").filter(Boolean);
    const blogIndex = segments.indexOf(type);
    return blogIndex >= 0 && segments.length > blogIndex + 2
      ? segments[blogIndex + 1]
      : "";
  }
  
  async function fetchTitleFromUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch title from ${url}: ${response.statusText}`
      );
    }
  
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $("title").text();
    return title.split("|").map((part) => part.trim())[0] || title;
  }
  
  function formatTitleFromUrl(url: string): string {
    const segments = url.split("/").filter(Boolean);
    const lastSegment = segments.pop()?.split("?")[0] || "";
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} 00:00:00`;
  }