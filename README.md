# Disk Backed Array
Disked backed array is a data structure that combines the benefits of an array with the persistence of disk storage.

## Quickstart

### Installation

```bash
npm install disk-backed-array
```

### Usage

```typescript
import { DiskBackedArray } from 'disk-backed-array';

const diskBackedArray: DiskBackedArray = new DiskBackedArray('logs.bin');

await diskBackedArray.set(0, Buffer.from('hello world'));

const buffer: Buffer = await diskBackedArray.get(0);
```

## API

### `close(): Promise<void>`

Closes the file descriptor

```typescript
await diskBackedArray.close();
```

### `get(index: number): Promise<Buffer>`

Returns data stored at specified index

```typescript
const buffer: Buffer = await diskBackedArray.get(0);
```

### `length(): Promise<number>`

Return length of array

```typescript
const length: number = await diskBackedArray.length();
```

### `set(index: number, data: Buffer): Promise<void>`

Sets data at specified index

```typescript
await diskBackedArray.set(0, buffer);
```

## File Format

```
********************************************
**  checksum  **  length   **  data       **
**  8 bytes   **  3 bytes  **  512 bytes  **
********************************************
```

## Performance

|                     | set/second | get/second |
|---------------------|------------|------------|
| Single Queue        | 17 685     |            |
| Parallel Queue (3)  | 26 234     |            |
