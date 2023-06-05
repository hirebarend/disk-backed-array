import * as fs from 'fs';

export class FsHelper {
  public static async read(
    fd: number,
    position: number,
    length: number
  ): Promise<Buffer> {
    return await new Promise((resolve, reject) => {
      fs.read(
        fd,
        Buffer.alloc(1024),
        0,
        length,
        position,
        (
          error: NodeJS.ErrnoException | null,
          bytesRead: number,
          buffer: Buffer
        ) => {
          if (error) {
            reject(error);

            return;
          }

          if (bytesRead !== length) {
            reject(new Error(`expected ${length}, got ${bytesRead}`));

            return;
          }

          resolve(buffer.subarray(0, bytesRead));
        }
      );
    });
  }

  public static async write(fd: number, buffer: Buffer, position: number) {
    return await new Promise((resolve, reject) => {
      fs.write(
        fd,
        buffer,
        0,
        buffer.length,
        position,
        (error: NodeJS.ErrnoException | null, written: number) => {
          if (error) {
            reject(error);

            return;
          }

          if (written !== buffer.length) {
            reject(new Error(`expected ${length}, got ${buffer.length}`));

            return;
          }

          resolve(true);
        }
      );
    });
  }
}
