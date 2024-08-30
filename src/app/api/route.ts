import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

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
    } = body;
    const parsedUrl = new URL(xml);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    const urls = await extractUrlsFromSitemap(xml, type);
    const blogPosts = await Promise.all(
      //take multiple promise as input and return single promise
      urls.map(async (url: string) => {
        const category = extractCategoryFromUrl(url, type);
        const title = category
          ? await fetchTitleFromUrl(url)
          : formatTitleFromUrl(url);
        let splitUrlForSlug = url.split("/").filter(Boolean);
        const slug = splitUrlForSlug[splitUrlForSlug.length - 1];

        if (onBasisOfCategory && !category) {
          return {
            url,
            title,
            category,
            content: null,
            date: null,
            author: null,
            image: null,
            imageAlt: null,
            slug,
          };
        }

        const { content, date, author, image, imageAlt } = await fetchPageData(
          url,
          contentClass,
          InfoClass,
          ImageClass,
          baseUrl
        );
        return {
          url,
          title,
          category,
          content,
          date,
          author,
          image,
          imageAlt,
          slug,
        };
      })
    );
    return NextResponse.json(
      JSON.parse(JSON.stringify(blogPosts, htmlAttributeReplacer))
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
const encodeHtmlAttributes = (str: string) => {
  return str
    .replace(/&quot;/g, '"')
    .replace(/"/g, "")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "");
};

const htmlAttributeReplacer = (key: any, value: string) => {
  if (typeof value === "string") {
    // Check if the string looks like it contains HTML attributes
    if (value.includes("=") && (value.includes('"') || value.includes("'"))) {
      return encodeHtmlAttributes(value);
    }
    value.replace(/\n/g, "");
    // For non-HTML attribute strings, just replace quotes
    return value.replace(/"/g, "");
  }
  return value;
};

async function fetchPageData(
  url: string,
  contentClass: string,
  InfoClass: string,
  ImageClass: string,
  baseUrl: string
) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    const $ = cheerio.load(data);

    let contentInnerHtml = $(`.${contentClass}`);

    contentInnerHtml.find("img").each((_, img) => {
      let src = $(img).attr("src");

      // Ensure the src is not already an absolute URL
      if (src && !src.startsWith("http") && !src.startsWith("https")) {
        src = src.replace(/\\/g, "");
        // console.log(src);

        // Prepend the base URL
        $(img).attr("src", baseUrl + src);
      }
    });
    let content = contentInnerHtml.html();

    // Extract date
    const dateElement = $(`.${InfoClass} div`)?.eq(0).text().trim();
    const formattedDate = dateElement ? formatDate(dateElement) : null;

    // Extract author
    const authorElement = $(`.${InfoClass} div`)?.eq(2).text().trim();

    // Extract feature image
    let imageUrl = $(`.${ImageClass} img`).attr("src") || "";
    imageUrl =
      imageUrl && imageUrl.startsWith("/") ? baseUrl + imageUrl : imageUrl;

    const imageAlt = $(`.${ImageClass} img`).attr("alt") || "";

    return {
      content,
      date: formattedDate,
      author: authorElement,
      image: imageUrl,
      imageAlt: imageAlt,
    };
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
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
  const data = await response.text();
  const parsedSitemap = await parseStringPromise(data);
  const urls: string[] = parsedSitemap.urlset.url.map(
    (entry: any) => entry.loc[0]
  );

  const blogUrls = urls.filter((url: string) => url.includes(type));
  return blogUrls;
}

function extractCategoryFromUrl(url: string, type: string): string {
  const segments = url.split("/").filter(Boolean);
  const blogIndex = segments.findIndex((segment) => segment === type);
  if (blogIndex >= 0 && segments.length > blogIndex + 2) {
    return segments[blogIndex + 1];
  }
  return "";
}

async function fetchTitleFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  let title = $("title").text();
  return title.split("|").map((part) => part.trim())[0] || title;
}

function formatTitleFromUrl(url: string): string {
  const segments = url.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1].split("?")[0];
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
