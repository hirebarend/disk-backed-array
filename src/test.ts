import { PartitionedDiskBackedArray } from './partitioned-disk-backed-array';

(async () => {
  const partitionedDiskBackedArray: PartitionedDiskBackedArray =
    new PartitionedDiskBackedArray('logs', 'log');

  await partitionedDiskBackedArray.open();

  console.log(await partitionedDiskBackedArray.length());

  await partitionedDiskBackedArray.truncate(1400000);

  // const n: number = 2000000;

  // const buffers = [
  //   Buffer.from(JSON.stringify({ hello: 'world' }), 'utf-8'),
  //   Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8'),
  //   Buffer.from(JSON.stringify({ james: 'smith' }), 'utf-8'),
  // ];

  // const t = process.hrtime();

  // let j = 0;

  // while (j < n) {
  //   await partitionedDiskBackedArray.append(buffers[j % buffers.length]);

  //   j++;
  // }

  // // wait partitionedDiskBackedArray.close();

  // const hrtime: [number, number] = process.hrtime(t);

  // const seconds: number = hrtime[0] + hrtime[1] / 1000 / 1000 / 1000;

  // console.log(n / seconds);
})();
