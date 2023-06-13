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

await diskBackedArray.open();

await diskBackedArray.set(0, Buffer.from('hello world'));

const buffer: Buffer = await diskBackedArray.get(0);
```

```typescript
import { PartitionedDiskBackedArray } from 'disk-backed-array';

const partitionedDiskBackedArray: PartitionedDiskBackedArray = new PartitionedDiskBackedArray('data', 'logs');

await partitionedDiskBackedArray.open();

await partitionedDiskBackedArray.append(Buffer.from('hello world'));

const buffer: Buffer = await partitionedDiskBackedArray.get(0);
```

## DiskBackedArray API

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

### `length(): number`

Return length of array

```typescript
const length: number = diskBackedArray.length();
```

### `open(): Promise<void>`

Opens the file descriptor

```typescript
await diskBackedArray.open();
```

### `set(index: number, data: Buffer): Promise<void>`

Sets data at specified index

```typescript
await diskBackedArray.set(0, buffer);
```

### `truncate(index: number): Promise<void>`

Truncates data at specified index

```typescript
await diskBackedArray.truncate(0);
```

## PartitionedDiskBackedArray API

### `append(data: Buffer): Promise<void>`

Sets data at the last index

```typescript
await partitionedDiskBackedArray.append(buffer);
```

### `isClose(): boolean`

```typescript
const isClose: boolean = await partitionedDiskBackedArray.isClose();
```

### `open(): Promise<void>`

Opens the file descriptor

```typescript
await partitionedDiskBackedArray.open();
```

### `length(): number`

Return length of array

```typescript
const length: number = partitionedDiskBackedArray.length();
```

### `get(index: number): Promise<Buffer>`

Returns data stored at specified index

```typescript
const buffer: Buffer = await partitionedDiskBackedArray.get(0);
```

### `truncate(index: number): Promise<void>`

Truncates data at specified index

```typescript
await partitionedDiskBackedArray.truncate(0);
```

## File Format

```
********************************************
**  checksum  **  length   **  data       **
**  8 bytes   **  3 bytes  **  512 bytes  **
********************************************
```

## Performance

|                    | set/second | get/second |
| ------------------ | ---------- | ---------- |
| Single Queue       | 17 685     |            |
| Parallel Queue (3) | 26 234     |            |
