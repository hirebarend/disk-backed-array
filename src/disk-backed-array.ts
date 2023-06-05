import * as crc32 from 'crc-32';
import * as fs from 'fs';
import { StringHelper } from './string.helper';
import { FsHelper } from './fs.helper';

export class DiskBackedArray {
  protected checksumPadding: number = 8;

  protected dataPadding: number = 512;

  protected fd: number | null = null;

  protected lengthPadding: number = 3;

  constructor(protected filename: string) {
    if (fs.existsSync(this.filename)) {
      this.fd = fs.openSync(this.filename, 'r+');
    } else {
      this.fd = fs.openSync(this.filename, 'w+');
    }
  }

  public async close(): Promise<void> {
    await new Promise((resolve, reject) => {
      if (!this.fd) {
        resolve(false);

        return;
      }

      fs.fsyncSync(this.fd);

      fs.close(this.fd, (error) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(true);
      });
    });

    this.fd = null;
  }

  public async get(index: number): Promise<Buffer> {
    if (!this.fd) {
      throw new Error();
    }

    const checksumAndLengthBuffer: Buffer = await FsHelper.read(
      this.fd,
      index * (this.checksumPadding + this.lengthPadding + this.dataPadding),
      this.checksumPadding + this.lengthPadding
    );

    const checksum: string = checksumAndLengthBuffer
      .subarray(0, this.checksumPadding)
      .toString();

    const length: number = parseInt(
      checksumAndLengthBuffer.subarray(this.checksumPadding).toString()
    );

    const data: Buffer = await FsHelper.read(
      this.fd,
      index * (this.checksumPadding + this.lengthPadding + this.dataPadding) +
        this.checksumPadding +
        this.lengthPadding,
      length
    );

    if (
      checksum !==
      StringHelper.addPadding(
        Math.abs(crc32.buf(data)).toString(16),
        this.checksumPadding
      )
    ) {
      throw new Error('corrupted');
    }

    return data;
  }

  public async length(): Promise<number> {
    const stats: fs.Stats = fs.statSync(this.filename);

    return (
      stats.size /
      (this.checksumPadding + this.lengthPadding + this.dataPadding)
    );
  }

  public async set(index: number, data: Buffer): Promise<void> {
    if (!this.fd) {
      return;
    }

    const checksum: string = StringHelper.addPadding(
      Math.abs(crc32.buf(data)).toString(16),
      this.checksumPadding
    );

    const buffer: Buffer = Buffer.concat([
      Buffer.from(checksum),
      Buffer.from(
        StringHelper.addPadding(data.length.toString(), this.lengthPadding)
      ),
      data,
      Buffer.alloc(this.dataPadding - data.length).fill(0),
    ]);

    await FsHelper.write(
      this.fd,
      buffer,
      index * (this.checksumPadding + this.lengthPadding + this.dataPadding)
    );
  }
}
