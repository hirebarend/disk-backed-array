import { DiskBackedArray } from './disk-backed-array';

(async () => {
  const benchmarks: Array<number> = [];

  for (let i = 0; i < 20; i++) {
    const diskBackedArray: DiskBackedArray = new DiskBackedArray(
      `logs/logs-${i}.bin`
    );

    const n: number = 200000;

    const buffers = [
      Buffer.from(JSON.stringify({ hello: 'world' }), 'utf-8'),
      Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8'),
      Buffer.from(JSON.stringify({ james: 'smith' }), 'utf-8'),
    ];

    const t = process.hrtime();

    let j = 0;

    while (j < n) {
      // await diskBackedArray.set(j, buffers[j % buffers.length]);

      // j ++;

      const promises = [];

      for (let k = 0; k < 3; k++) {
        promises.push(diskBackedArray.set(j, buffers[j % buffers.length]));

        j++;
      }

      await Promise.all(promises);
    }

    await diskBackedArray.close();

    const hrtime: [number, number] = process.hrtime(t);

    const seconds: number = hrtime[0] + hrtime[1] / 1000 / 1000 / 1000;

    benchmarks.push(n / seconds);

    console.log(n / seconds);
  }

  console.log(benchmarks.reduce((a, b) => a + b) / benchmarks.length);
})();
