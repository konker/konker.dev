[**@konker.dev/neverthrow-r-utils**](../../../README.md)

***

[@konker.dev/neverthrow-r-utils](../../../modules.md) / [stream/BufferWriteableStream](../README.md) / BufferWriteableStream

# Class: BufferWriteableStream

Defined in: [packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts:12](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts#L12)

Simplistic implementation of a Writeable which stores the data in a Buffer
The contents can be extracted as a Buffer or as a UTF-8 string.

Mainly useful for testing stream based code. If something like this is
needed for production use, consider a more comprehensive/optimized
implementation such as: https://github.com/samcday/node-stream-buffer

## Extends

- `Writable`

## Constructors

### Constructor

> **new BufferWriteableStream**(): `BufferWriteableStream`

Defined in: [packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts:15](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts#L15)

#### Returns

`BufferWriteableStream`

#### Overrides

`Writable.constructor`

## Properties

### bufferList

> `readonly` **bufferList**: `Buffer`\<`ArrayBufferLike`\>[]

Defined in: [packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts:13](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts#L13)

***

### closed

> `readonly` **closed**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:809

Is `true` after `'close'` has been emitted.

#### Since

v18.0.0

#### Inherited from

`Writable.closed`

***

### destroyed

> **destroyed**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:804

Is `true` after `writable.destroy()` has been called.

#### Since

v8.0.0

#### Inherited from

`Writable.destroyed`

***

### errored

> `readonly` **errored**: `Error` \| `null`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:814

Returns error if the stream has been destroyed with an error.

#### Since

v18.0.0

#### Inherited from

`Writable.errored`

***

### writable

> **writable**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:760

Is `true` if it is safe to call `writable.write()`, which means
the stream has not been destroyed, errored, or ended.

#### Since

v11.4.0

#### Inherited from

`Writable.writable`

***

### writableAborted

> `readonly` **writableAborted**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:765

Returns whether the stream was destroyed or errored before emitting `'finish'`.

#### Since

v18.0.0, v16.17.0

#### Inherited from

`Writable.writableAborted`

***

### writableCorked

> `readonly` **writableCorked**: `number`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:799

Number of times `writable.uncork()` needs to be
called in order to fully uncork the stream.

#### Since

v13.2.0, v12.16.0

#### Inherited from

`Writable.writableCorked`

***

### writableEnded

> `readonly` **writableEnded**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:771

Is `true` after `writable.end()` has been called. This property
does not indicate whether the data has been flushed, for this use `writable.writableFinished` instead.

#### Since

v12.9.0

#### Inherited from

`Writable.writableEnded`

***

### writableFinished

> `readonly` **writableFinished**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:776

Is set to `true` immediately before the `'finish'` event is emitted.

#### Since

v12.6.0

#### Inherited from

`Writable.writableFinished`

***

### writableHighWaterMark

> `readonly` **writableHighWaterMark**: `number`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:781

Return the value of `highWaterMark` passed when creating this `Writable`.

#### Since

v9.3.0

#### Inherited from

`Writable.writableHighWaterMark`

***

### writableLength

> `readonly` **writableLength**: `number`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:788

This property contains the number of bytes (or objects) in the queue
ready to be written. The value provides introspection data regarding
the status of the `highWaterMark`.

#### Since

v9.4.0

#### Inherited from

`Writable.writableLength`

***

### writableNeedDrain

> `readonly` **writableNeedDrain**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:819

Is `true` if the stream's buffer has been full and stream will emit `'drain'`.

#### Since

v15.2.0, v14.17.0

#### Inherited from

`Writable.writableNeedDrain`

***

### writableObjectMode

> `readonly` **writableObjectMode**: `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:793

Getter for the property `objectMode` of a given `Writable` stream.

#### Since

v12.3.0

#### Inherited from

`Writable.writableObjectMode`

## Accessors

### buffer

#### Get Signature

> **get** **buffer**(): `Buffer`

Defined in: [packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts:35](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts#L35)

Get the underlying buffer for this stream

##### Returns

`Buffer`

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts:28](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts#L28)

Get the current size of the data in the buffer

##### Returns

`number`

***

### string

#### Get Signature

> **get** **string**(): `string`

Defined in: [packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts:42](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts#L42)

Get the contents of the buffer as a UTF-8 string

##### Returns

`string`

## Methods

### \_construct()?

> `optional` **\_construct**(`callback`): `void`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:828

#### Parameters

##### callback

(`error?`) => `void`

#### Returns

`void`

#### Inherited from

`Writable._construct`

***

### \_destroy()

> **\_destroy**(`error`, `callback`): `void`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:829

#### Parameters

##### error

`Error` | `null`

##### callback

(`error?`) => `void`

#### Returns

`void`

#### Inherited from

`Writable._destroy`

***

### \_final()

> **\_final**(`callback`): `void`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:830

#### Parameters

##### callback

(`error?`) => `void`

#### Returns

`void`

#### Inherited from

`Writable._final`

***

### \_write()

> **\_write**(`chunk`, `_encoding`, `callback`): `void`

Defined in: [packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts:20](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-utils/src/stream/BufferWriteableStream.ts#L20)

#### Parameters

##### chunk

`never`

##### \_encoding

`BufferEncoding`

##### callback

(`error?`) => `void`

#### Returns

`void`

#### Overrides

`Writable._write`

***

### \_writev()?

> `optional` **\_writev**(`chunks`, `callback`): `void`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:821

#### Parameters

##### chunks

`object`[]

##### callback

(`error?`) => `void`

#### Returns

`void`

#### Inherited from

`Writable._writev`

***

### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1014

Calls `writable.destroy()` with an `AbortError` and returns
a promise that fulfills when the stream is finished.

#### Returns

`Promise`\<`void`\>

#### Since

v22.4.0, v20.16.0

#### Inherited from

`Writable.[asyncDispose]`

***

### \[captureRejectionSymbol\]()?

> `optional` **\[captureRejectionSymbol\]**(`error`, `event`, ...`args`): `void`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/events.d.ts:87

The `Symbol.for('nodejs.rejection')` method is called in case a
promise rejection happens when emitting an event and
`captureRejections` is enabled on the emitter.
It is possible to use `events.captureRejectionSymbol` in
place of `Symbol.for('nodejs.rejection')`.

```js
import { EventEmitter, captureRejectionSymbol } from 'node:events';

class MyClass extends EventEmitter {
  constructor() {
    super({ captureRejections: true });
  }

  [captureRejectionSymbol](err, event, ...args) {
    console.log('rejection happened for', event, 'with', err, ...args);
    this.destroy(err);
  }

  destroy(err) {
    // Tear the resource down here.
  }
}
```

#### Parameters

##### error

`Error`

##### event

`string` | `symbol`

##### args

...`any`[]

#### Returns

`void`

#### Since

v13.4.0, v12.16.0

#### Inherited from

`Writable.[captureRejectionSymbol]`

***

### addListener()

#### Call Signature

> **addListener**\<`E`\>(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1016

Alias for `emitter.on(eventName, listener)`.

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Since

v0.1.26

##### Inherited from

`Writable.addListener`

#### Call Signature

> **addListener**(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1020

##### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Inherited from

`Writable.addListener`

***

### cork()

> **cork**(): `void`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:957

The `writable.cork()` method forces all written data to be buffered in memory.
The buffered data will be flushed when either the [uncork](#uncork) or [end](#end) methods are called.

The primary intent of `writable.cork()` is to accommodate a situation in which
several small chunks are written to the stream in rapid succession. Instead of
immediately forwarding them to the underlying destination, `writable.cork()` buffers all the chunks until `writable.uncork()` is called, which will pass them
all to `writable._writev()`, if present. This prevents a head-of-line blocking
situation where data is being buffered while waiting for the first small chunk
to be processed. However, use of `writable.cork()` without implementing `writable._writev()` may have an adverse effect on throughput.

See also: `writable.uncork()`, `writable._writev()`.

#### Returns

`void`

#### Since

v0.11.2

#### Inherited from

`Writable.cork`

***

### destroy()

> **destroy**(`error?`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1008

Destroy the stream. Optionally emit an `'error'` event, and emit a `'close'` event (unless `emitClose` is set to `false`). After this call, the writable
stream has ended and subsequent calls to `write()` or `end()` will result in
an `ERR_STREAM_DESTROYED` error.
This is a destructive and immediate way to destroy a stream. Previous calls to `write()` may not have drained, and may trigger an `ERR_STREAM_DESTROYED` error.
Use `end()` instead of destroy if data should flush before close, or wait for
the `'drain'` event before destroying the stream.

Once `destroy()` has been called any further calls will be a no-op and no
further errors except from `_destroy()` may be emitted as `'error'`.

Implementors should not override this method,
but instead implement `writable._destroy()`.

#### Parameters

##### error?

`Error`

Optional, an error to emit with `'error'` event.

#### Returns

`this`

#### Since

v8.0.0

#### Inherited from

`Writable.destroy`

***

### emit()

#### Call Signature

> **emit**\<`E`\>(`eventName`, ...`args`): `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1021

Synchronously calls each of the listeners registered for the event named
`eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

###### args

...`WritableEventMap`\[`E`\]

##### Returns

`boolean`

##### Since

v0.1.26

##### Inherited from

`Writable.emit`

#### Call Signature

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1022

##### Parameters

###### eventName

`string` | `symbol`

###### args

...`any`[]

##### Returns

`boolean`

##### Inherited from

`Writable.emit`

***

### end()

#### Call Signature

> **end**(`cb?`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:923

Calling the `writable.end()` method signals that no more data will be written
to the `Writable`. The optional `chunk` and `encoding` arguments allow one
final additional chunk of data to be written immediately before closing the
stream.

Calling the [write](#write) method after calling [end](#end) will raise an error.

```js
// Write 'hello, ' and then end with 'world!'.
import fs from 'node:fs';
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// Writing more now is not allowed!
```

##### Parameters

###### cb?

() => `void`

Callback for when the stream is finished.

##### Returns

`this`

##### Since

v0.9.4

##### Inherited from

`Writable.end`

#### Call Signature

> **end**(`chunk`, `cb?`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:932

Signals that no more data will be written, with one final chunk of data.

##### Parameters

###### chunk

`any`

Optional data to write. For streams not operating in object mode, `chunk` must be a {string}, {Buffer},
{TypedArray} or {DataView}. For object mode streams, `chunk` may be any JavaScript value other than `null`.

###### cb?

() => `void`

Callback for when the stream is finished.

##### Returns

`this`

##### See

Writable.end for full details.

##### Since

v0.9.4

##### Inherited from

`Writable.end`

#### Call Signature

> **end**(`chunk`, `encoding`, `cb?`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:942

Signals that no more data will be written, with one final chunk of data.

##### Parameters

###### chunk

`any`

Optional data to write. For streams not operating in object mode, `chunk` must be a {string}, {Buffer},
{TypedArray} or {DataView}. For object mode streams, `chunk` may be any JavaScript value other than `null`.

###### encoding

`BufferEncoding`

The encoding if `chunk` is a string

###### cb?

() => `void`

Callback for when the stream is finished.

##### Returns

`this`

##### See

Writable.end for full details.

##### Since

v0.9.4

##### Inherited from

`Writable.end`

***

### eventNames()

> **eventNames**(): (`string` \| `symbol`)[]

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/events.d.ts:154

Returns an array listing the events for which the emitter has registered
listeners.

```js
import { EventEmitter } from 'node:events';

const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

#### Returns

(`string` \| `symbol`)[]

#### Since

v6.0.0

#### Inherited from

`Writable.eventNames`

***

### getMaxListeners()

> **getMaxListeners**(): `number`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/events.d.ts:161

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to
`events.defaultMaxListeners`.

#### Returns

`number`

#### Since

v1.0.0

#### Inherited from

`Writable.getMaxListeners`

***

### listenerCount()

#### Call Signature

> **listenerCount**\<`E`\>(`eventName`, `listener?`): `number`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1023

Returns the number of listeners listening for the event named `eventName`.
If `listener` is provided, it will return how many times the listener is found
in the list of the listeners of the event.

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

The name of the event being listened for

###### listener?

(...`args`) => `void`

The event handler function

##### Returns

`number`

##### Since

v3.2.0

##### Inherited from

`Writable.listenerCount`

#### Call Signature

> **listenerCount**(`eventName`, `listener?`): `number`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1027

##### Parameters

###### eventName

`string` | `symbol`

###### listener?

(...`args`) => `void`

##### Returns

`number`

##### Inherited from

`Writable.listenerCount`

***

### listeners()

#### Call Signature

> **listeners**\<`E`\>(`eventName`): (...`args`) => `void`[]

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1028

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

##### Returns

(...`args`) => `void`[]

##### Since

v0.1.26

##### Inherited from

`Writable.listeners`

#### Call Signature

> **listeners**(`eventName`): (...`args`) => `void`[]

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1029

##### Parameters

###### eventName

`string` | `symbol`

##### Returns

(...`args`) => `void`[]

##### Inherited from

`Writable.listeners`

***

### off()

#### Call Signature

> **off**\<`E`\>(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1030

Alias for `emitter.removeListener()`.

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Since

v10.0.0

##### Inherited from

`Writable.off`

#### Call Signature

> **off**(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1031

##### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Inherited from

`Writable.off`

***

### on()

#### Call Signature

> **on**\<`E`\>(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1032

Adds the `listener` function to the end of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`
and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The
`emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

The name of the event.

###### listener

(...`args`) => `void`

The callback function

##### Returns

`this`

##### Since

v0.1.101

##### Inherited from

`Writable.on`

#### Call Signature

> **on**(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1033

##### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Inherited from

`Writable.on`

***

### once()

#### Call Signature

> **once**\<`E`\>(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1034

Adds a **one-time** `listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The
`emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

The name of the event.

###### listener

(...`args`) => `void`

The callback function

##### Returns

`this`

##### Since

v0.3.0

##### Inherited from

`Writable.once`

#### Call Signature

> **once**(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1038

##### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Inherited from

`Writable.once`

***

### pipe()

> **pipe**\<`T`\>(`destination`, `options?`): `T`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:10

#### Type Parameters

##### T

`T` *extends* `WritableStream`

#### Parameters

##### destination

`T`

##### options?

`PipeOptions`

#### Returns

`T`

#### Since

v0.9.4

#### Inherited from

`Writable.pipe`

***

### prependListener()

#### Call Signature

> **prependListener**\<`E`\>(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1039

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`
and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

The name of the event.

###### listener

(...`args`) => `void`

The callback function

##### Returns

`this`

##### Since

v6.0.0

##### Inherited from

`Writable.prependListener`

#### Call Signature

> **prependListener**(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1043

##### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Inherited from

`Writable.prependListener`

***

### prependOnceListener()

#### Call Signature

> **prependOnceListener**\<`E`\>(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1044

Adds a **one-time** `listener` function for the event named `eventName` to the
_beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

The name of the event.

###### listener

(...`args`) => `void`

The callback function

##### Returns

`this`

##### Since

v6.0.0

##### Inherited from

`Writable.prependOnceListener`

#### Call Signature

> **prependOnceListener**(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1048

##### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Inherited from

`Writable.prependOnceListener`

***

### rawListeners()

#### Call Signature

> **rawListeners**\<`E`\>(`eventName`): (...`args`) => `void`[]

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1049

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

##### Returns

(...`args`) => `void`[]

##### Since

v9.4.0

##### Inherited from

`Writable.rawListeners`

#### Call Signature

> **rawListeners**(`eventName`): (...`args`) => `void`[]

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1050

##### Parameters

###### eventName

`string` | `symbol`

##### Returns

(...`args`) => `void`[]

##### Inherited from

`Writable.rawListeners`

***

### removeAllListeners()

#### Call Signature

> **removeAllListeners**\<`E`\>(`eventName?`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1052

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName?

`E`

##### Returns

`this`

##### Since

v0.1.26

##### Inherited from

`Writable.removeAllListeners`

#### Call Signature

> **removeAllListeners**(`eventName?`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1053

##### Parameters

###### eventName?

`string` | `symbol`

##### Returns

`this`

##### Inherited from

`Writable.removeAllListeners`

***

### removeListener()

#### Call Signature

> **removeListener**\<`E`\>(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1054

Removes the specified `listener` from the listener array for the event named
`eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any
`removeListener()` or `removeAllListeners()` calls _after_ emitting and
_before_ the last listener finishes execution will not remove them from
`emit()` in progress. Subsequent events behave as expected.

```js
import { EventEmitter } from 'node:events';
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indexes of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')`
listener is removed:

```js
import { EventEmitter } from 'node:events';
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

##### Type Parameters

###### E

`E` *extends* keyof `WritableEventMap`

##### Parameters

###### eventName

`E`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Since

v0.1.26

##### Inherited from

`Writable.removeListener`

#### Call Signature

> **removeListener**(`eventName`, `listener`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:1058

##### Parameters

###### eventName

`string` | `symbol`

###### listener

(...`args`) => `void`

##### Returns

`this`

##### Inherited from

`Writable.removeListener`

***

### setDefaultEncoding()

> **setDefaultEncoding**(`encoding`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:903

The `writable.setDefaultEncoding()` method sets the default `encoding` for a `Writable` stream.

#### Parameters

##### encoding

`BufferEncoding`

The new default encoding

#### Returns

`this`

#### Since

v0.11.15

#### Inherited from

`Writable.setDefaultEncoding`

***

### setMaxListeners()

> **setMaxListeners**(`n`): `this`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/events.d.ts:436

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to
`Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

##### n

`number`

#### Returns

`this`

#### Since

v0.3.5

#### Inherited from

`Writable.setMaxListeners`

***

### uncork()

> **uncork**(): `void`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:991

The `writable.uncork()` method flushes all data buffered since [cork](#cork) was called.

When using `writable.cork()` and `writable.uncork()` to manage the buffering
of writes to a stream, defer calls to `writable.uncork()` using `process.nextTick()`. Doing so allows batching of all `writable.write()` calls that occur within a given Node.js event
loop phase.

```js
stream.cork();
stream.write('some ');
stream.write('data ');
process.nextTick(() => stream.uncork());
```

If the `writable.cork()` method is called multiple times on a stream, the
same number of calls to `writable.uncork()` must be called to flush the buffered
data.

```js
stream.cork();
stream.write('some ');
stream.cork();
stream.write('data ');
process.nextTick(() => {
  stream.uncork();
  // The data will not be flushed until uncork() is called a second time.
  stream.uncork();
});
```

See also: `writable.cork()`.

#### Returns

`void`

#### Since

v0.11.2

#### Inherited from

`Writable.uncork`

***

### write()

#### Call Signature

> **write**(`chunk`, `callback?`): `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:886

The `writable.write()` method writes some data to the stream, and calls the
supplied `callback` once the data has been fully handled. If an error
occurs, the `callback` will be called with the error as its
first argument. The `callback` is called asynchronously and before `'error'` is
emitted.

The return value is `true` if the internal buffer is less than the `highWaterMark` configured when the stream was created after admitting `chunk`.
If `false` is returned, further attempts to write data to the stream should
stop until the `'drain'` event is emitted.

While a stream is not draining, calls to `write()` will buffer `chunk`, and
return false. Once all currently buffered chunks are drained (accepted for
delivery by the operating system), the `'drain'` event will be emitted.
Once `write()` returns false, do not write more chunks
until the `'drain'` event is emitted. While calling `write()` on a stream that
is not draining is allowed, Node.js will buffer all written chunks until
maximum memory usage occurs, at which point it will abort unconditionally.
Even before it aborts, high memory usage will cause poor garbage collector
performance and high RSS (which is not typically released back to the system,
even after the memory is no longer required). Since TCP sockets may never
drain if the remote peer does not read the data, writing a socket that is
not draining may lead to a remotely exploitable vulnerability.

Writing data while the stream is not draining is particularly
problematic for a `Transform`, because the `Transform` streams are paused
by default until they are piped or a `'data'` or `'readable'` event handler
is added.

If the data to be written can be generated or fetched on demand, it is
recommended to encapsulate the logic into a `Readable` and use [pipe](#pipe). However, if calling `write()` is preferred, it is
possible to respect backpressure and avoid memory issues using the `'drain'` event:

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// Wait for cb to be called before doing any other write.
write('hello', () => {
  console.log('Write completed, do more writes now.');
});
```

A `Writable` stream in object mode will always ignore the `encoding` argument.

##### Parameters

###### chunk

`any`

Optional data to write. For streams not operating in object mode, `chunk` must be a {string}, {Buffer},
{TypedArray} or {DataView}. For object mode streams, `chunk` may be any JavaScript value other than `null`.

###### callback?

(`error`) => `void`

Callback for when this chunk of data is flushed.

##### Returns

`boolean`

`false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

##### Since

v0.9.4

##### Inherited from

`Writable.write`

#### Call Signature

> **write**(`chunk`, `encoding`, `callback?`): `boolean`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:897

Writes data to the stream, with an explicit encoding for string data.

##### Parameters

###### chunk

`any`

Optional data to write. For streams not operating in object mode, `chunk` must be a {string}, {Buffer},
{TypedArray} or {DataView}. For object mode streams, `chunk` may be any JavaScript value other than `null`.

###### encoding

`BufferEncoding`

The encoding, if `chunk` is a string.

###### callback?

(`error`) => `void`

Callback for when this chunk of data is flushed.

##### Returns

`boolean`

`false` if the stream wishes for the calling code to wait for the `'drain'` event to be emitted before continuing to write additional data; otherwise `true`.

##### See

Writable.write for full details.

##### Since

v0.9.4

##### Inherited from

`Writable.write`

***

### fromWeb()

> `static` **fromWeb**(`writableStream`, `options?`): `Writable`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:746

A utility method for creating a `Writable` from a web `WritableStream`.

#### Parameters

##### writableStream

`WritableStream`

##### options?

`Pick`\<`WritableOptions`\<`Writable`\>, `"decodeStrings"` \| `"highWaterMark"` \| `"objectMode"` \| `"signal"`\>

#### Returns

`Writable`

#### Since

v17.0.0

#### Inherited from

`Writable.fromWeb`

***

### toWeb()

> `static` **toWeb**(`streamWritable`): `WritableStream`

Defined in: node\_modules/.pnpm/@types+node@25.8.0/node\_modules/@types/node/stream.d.ts:754

A utility method for creating a web `WritableStream` from a `Writable`.

#### Parameters

##### streamWritable

`WritableStream`

#### Returns

`WritableStream`

#### Since

v17.0.0

#### Inherited from

`Writable.toWeb`
