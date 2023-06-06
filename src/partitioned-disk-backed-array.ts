import * as fs from 'fs';
import * as path from 'path';
import { DiskBackedArray } from './disk-backed-array';

export class PartitionedDiskBackedArray {
  protected nextIndex: number = 0;

  protected lengthOfPartition: number = 500000;

  public partitions: Array<{
    diskBackedArray: DiskBackedArray;
    index: number;
  }> = [];

  protected status: 'close' | 'open' = 'close';

  constructor(protected directory: string, protected name: string) {}

  public async append(data: Buffer): Promise<void> {
    if (this.isClose()) {
      throw new Error('partitioned disk backed array is close');
    }

    if (this.partitions.length === 0) {
      this.partitions.push({
        diskBackedArray: new DiskBackedArray(
          path.join(this.directory, `${this.name}-${0}.bin`)
        ),
        index: 0,
      });
    }

    const partition = this.partitions[this.partitions.length - 1];

    if (partition.diskBackedArray.isClose()) {
      await partition.diskBackedArray.open();
    }

    await partition.diskBackedArray.set(this.nextIndex - partition.index, data);

    if (this.nextIndex - partition.index >= this.lengthOfPartition) {
      this.partitions.push({
        diskBackedArray: new DiskBackedArray(
          path.join(this.directory, `${this.name}-${this.nextIndex}.bin`)
        ),
        index: this.nextIndex,
      });
    }

    this.nextIndex++;
  }

  public isClose(): boolean {
    return this.status === 'close';
  }

  public async open(): Promise<void> {
    const files: Array<string> = fs.readdirSync(this.directory);

    const regExp: RegExp = new RegExp(/^.+\-(\d+)\.bin$/);

    this.partitions = files
      .map((x) => {
        const regExpExecArray: RegExpExecArray | null = regExp.exec(x);

        if (!regExpExecArray) {
          throw new Error();
        }

        return {
          diskBackedArray: new DiskBackedArray(path.join(this.directory, x)),
          index: parseInt(regExpExecArray[1]),
        };
      })
      .sort((a, b) => a.index - b.index);

    this.status = 'open';

    this.nextIndex = await this.length();
  }

  public async length(): Promise<number> {
    if (this.isClose()) {
      throw new Error('partitioned disk backed array is close');
    }

    if (this.partitions.length === 0) {
      return 0;
    }

    const partition = this.partitions[this.partitions.length - 1];

    if (partition.diskBackedArray.isClose()) {
      await partition.diskBackedArray.open();
    }

    const length: number = partition.diskBackedArray.length();

    return partition.index + length;
  }

  public async get(index: number): Promise<Buffer> {
    if (this.isClose()) {
      throw new Error('partitioned disk backed array is close');
    }

    const partitions = this.partitions.filter(
      (x, i, self) =>
        x.index >= index || (self.length > i + 1 && self[i + 1].index >= index)
    );

    if (partitions.length === 0) {
      throw new Error('index out of bounds');
    }

    const partition = partitions[0];

    if (partition.diskBackedArray.isClose()) {
      await partition.diskBackedArray.open();
    }

    return await partition.diskBackedArray.get(index - partition.index);
  }

  public async truncate(index: number): Promise<void> {
    const partitions = this.partitions.filter(
      (x, i, self) =>
        x.index >= index || (self.length > i + 1 && self[i + 1].index >= index)
    );

    for (let i = 0; i < partitions.length; i++) {
      const partition = partitions[i];

      if (i === 0) {
        if (partition.diskBackedArray.isClose()) {
          await partition.diskBackedArray.open();
        }

        await partition.diskBackedArray.truncate(index - partition.index);
      } else {
        if (partition.diskBackedArray.isOpen()) {
          await partition.diskBackedArray.close();
        }

        fs.unlinkSync(
          path.join(this.directory, `${this.name}-${partition.index}.bin`)
        );
      }
    }
  }
}
