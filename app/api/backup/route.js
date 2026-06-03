import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import zlib from "zlib";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// CRC32 implementation (used by the ZIP format)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Minimal ZIP archive builder (DEFLATE compressed entries)
function createZip(files) {
  const fileRecords = [];
  const localParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const contentBuf = Buffer.from(file.content, "utf8");
    const crc = crc32(contentBuf);
    const compressed = zlib.deflateRawSync(contentBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(8, 8); // compression method: deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc32
    localHeader.writeUInt32LE(compressed.length, 18); // compressed size
    localHeader.writeUInt32LE(contentBuf.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28); // extra field length

    localParts.push(localHeader, nameBuf, compressed);

    fileRecords.push({
      nameBuf,
      crc,
      compressedSize: compressed.length,
      uncompressedSize: contentBuf.length,
      offset,
    });

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralParts = [];
  let centralSize = 0;
  for (const rec of fileRecords) {
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central dir signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(8, 10); // compression method: deflate
    central.writeUInt16LE(0, 12); // mod time
    central.writeUInt16LE(0, 14); // mod date
    central.writeUInt32LE(rec.crc, 16); // crc32
    central.writeUInt32LE(rec.compressedSize, 20); // compressed size
    central.writeUInt32LE(rec.uncompressedSize, 24); // uncompressed size
    central.writeUInt16LE(rec.nameBuf.length, 28); // file name length
    central.writeUInt16LE(0, 30); // extra field length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(rec.offset, 42); // local header offset

    centralParts.push(central, rec.nameBuf);
    centralSize += central.length + rec.nameBuf.length;
  }

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central dir signature
  end.writeUInt16LE(0, 4); // disk number
  end.writeUInt16LE(0, 6); // disk with central dir
  end.writeUInt16LE(fileRecords.length, 8); // entries on this disk
  end.writeUInt16LE(fileRecords.length, 10); // total entries
  end.writeUInt32LE(centralSize, 12); // central dir size
  end.writeUInt32LE(offset, 16); // central dir offset
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localParts, ...centralParts, end]);
}

export async function GET() {
  try {
    // All MongoDB collections (Prisma models)
    const tables = {
      Product: () => prisma.product.findMany(),
      Category: () => prisma.category.findMany(),
      Factory: () => prisma.factory.findMany(),
      Offer: () => prisma.offer.findMany(),
      Order: () => prisma.order.findMany(),
      Review: () => prisma.review.findMany(),
      Banner: () => prisma.banner.findMany(),
      Banner1: () => prisma.banner1.findMany(),
      Banner2: () => prisma.banner2.findMany(),
      Banner3: () => prisma.banner3.findMany(),
      OtherBanner: () => prisma.otherBanner.findMany(),
      Section: () => prisma.section.findMany(),
      OfferText: () => prisma.offerText.findMany(),
      Color: () => prisma.color.findMany(),
      Size: () => prisma.size.findMany(),
    };

    const files = [];
    for (const [name, fetcher] of Object.entries(tables)) {
      let data = [];
      try {
        data = await fetcher();
      } catch (e) {
        data = { error: `Failed to read ${name}`, message: String(e) };
      }
      files.push({
        name: `${name}.json`,
        content: JSON.stringify(data, null, 2),
      });
    }

    const zipBuffer = createZip(files);

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="backup-${stamp}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Backup failed", message: String(error) },
      { status: 500 }
    );
  }
}
