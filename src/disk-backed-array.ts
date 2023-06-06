import * as crc32 from 'crc-32';
import * as fs from 'fs';
import { StringHelper } from './string.helper';
import { FsHelper } from './fs.helper';

export class DiskBackedArray {
  protected checksumPadding: number = 8;

  protected dataPadding: number = 512;

  protected fd: number | null = null;

  protected lengthPadding: number = 3;

  protected size: number = 0;

  protected status: 'close' | 'open' = 'close';

  constructor(protected filename: string) {}

  public async close(): Promise<void> {
    await new Promise((resolve, reject) => {
      if (!this.fd) {
        reject(new Error('file descriptor is null'));

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

    this.status = 'close';
  }

  public async get(index: number): Promise<Buffer> {
    if (!this.fd) {
      throw new Error('file descriptor is null');
    }

    if (index >= this.length()) {
      throw new Error('index out of bounds');
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
      throw new Error('data corrupted at index');
    }

    return data;
  }

  public isClose(): boolean {
    return this.status === 'close';
  }

  public isOpen(): boolean {
    return this.status === 'open';
  }

  public length(): number {
    if (this.isClose()) {
      throw new Error('disk backed array is close');
    }

    return (
      this.size / (this.checksumPadding + this.lengthPadding + this.dataPadding)
    );
  }

  public async open(): Promise<void> {
    if (fs.existsSync(this.filename)) {
      this.fd = fs.openSync(this.filename, 'r+');

      const stats: fs.Stats = fs.statSync(this.filename);

      this.size = stats.size;
    } else {
      this.fd = fs.openSync(this.filename, 'w+');
    }

    this.status = 'open';
  }

  public async set(index: number, data: Buffer): Promise<void> {
    if (!this.fd) {
      throw new Error('file descriptor is null');
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

    this.size = Math.max(
      this.size,
      (index + 1) *
        (this.checksumPadding + this.lengthPadding + this.dataPadding)
    );
  }

  public async truncate(index: number): Promise<void> {
    await new Promise((resolve, reject) => {
      if (!this.fd) {
        reject(new Error('file descriptor is null'));

        return;
      }

      fs.ftruncate(
        this.fd,
        index * (this.checksumPadding + this.lengthPadding + this.dataPadding),
        (error) => {
          if (error) {
            reject(error);

            return;
          }

          resolve(true);
        }
      );
    });
  }
}
