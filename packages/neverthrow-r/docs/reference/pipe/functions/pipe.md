[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../modules.md) / [pipe](../README.md) / pipe

# Function: pipe()

## Call Signature

> **pipe**\<`A`\>(`value`): `A`

Defined in: [pipe.ts:64](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L64)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

### Parameters

#### value

`A`

The initial value.

### Returns

`A`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`\>(`value`, `ab`): `B`

Defined in: [pipe.ts:65](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L65)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

### Returns

`B`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`\>(`value`, `ab`, `bc`): `C`

Defined in: [pipe.ts:66](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L66)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

### Returns

`C`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`\>(`value`, `ab`, `bc`, `cd`): `D`

Defined in: [pipe.ts:67](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L67)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

### Returns

`D`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`\>(`value`, `ab`, `bc`, `cd`, `de`): `E`

Defined in: [pipe.ts:68](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L68)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

### Returns

`E`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`): `F`

Defined in: [pipe.ts:75](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L75)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

### Returns

`F`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`): `G`

Defined in: [pipe.ts:83](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L83)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

### Returns

`G`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`): `H`

Defined in: [pipe.ts:92](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L92)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

### Returns

`H`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`): `I`

Defined in: [pipe.ts:102](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L102)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

### Returns

`I`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`): `J`

Defined in: [pipe.ts:113](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L113)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

### Returns

`J`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`): `K`

Defined in: [pipe.ts:125](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L125)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

### Returns

`K`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`): `L`

Defined in: [pipe.ts:138](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L138)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

### Returns

`L`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`): `M`

Defined in: [pipe.ts:152](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L152)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

### Returns

`M`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`): `N`

Defined in: [pipe.ts:167](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L167)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

### Returns

`N`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`, `no`): `O`

Defined in: [pipe.ts:183](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L183)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

#### O

`O`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

#### no

`UnaryFn`\<`N`, `O`\>

### Returns

`O`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`, `no`, `op`): `P`

Defined in: [pipe.ts:200](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L200)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

#### O

`O`

#### P

`P`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

#### no

`UnaryFn`\<`N`, `O`\>

#### op

`UnaryFn`\<`O`, `P`\>

### Returns

`P`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`, `no`, `op`, `pq`): `Q`

Defined in: [pipe.ts:218](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L218)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

#### O

`O`

#### P

`P`

#### Q

`Q`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

#### no

`UnaryFn`\<`N`, `O`\>

#### op

`UnaryFn`\<`O`, `P`\>

#### pq

`UnaryFn`\<`P`, `Q`\>

### Returns

`Q`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`, `no`, `op`, `pq`, `qr`): `R`

Defined in: [pipe.ts:237](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L237)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

#### O

`O`

#### P

`P`

#### Q

`Q`

#### R

`R`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

#### no

`UnaryFn`\<`N`, `O`\>

#### op

`UnaryFn`\<`O`, `P`\>

#### pq

`UnaryFn`\<`P`, `Q`\>

#### qr

`UnaryFn`\<`Q`, `R`\>

### Returns

`R`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`, `no`, `op`, `pq`, `qr`, `rs`): `S`

Defined in: [pipe.ts:257](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L257)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

#### O

`O`

#### P

`P`

#### Q

`Q`

#### R

`R`

#### S

`S`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

#### no

`UnaryFn`\<`N`, `O`\>

#### op

`UnaryFn`\<`O`, `P`\>

#### pq

`UnaryFn`\<`P`, `Q`\>

#### qr

`UnaryFn`\<`Q`, `R`\>

#### rs

`UnaryFn`\<`R`, `S`\>

### Returns

`S`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`, `no`, `op`, `pq`, `qr`, `rs`, `st`): `T`

Defined in: [pipe.ts:278](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L278)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

#### O

`O`

#### P

`P`

#### Q

`Q`

#### R

`R`

#### S

`S`

#### T

`T`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

#### no

`UnaryFn`\<`N`, `O`\>

#### op

`UnaryFn`\<`O`, `P`\>

#### pq

`UnaryFn`\<`P`, `Q`\>

#### qr

`UnaryFn`\<`Q`, `R`\>

#### rs

`UnaryFn`\<`R`, `S`\>

#### st

`UnaryFn`\<`S`, `T`\>

### Returns

`T`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```

## Call Signature

> **pipe**\<`A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`, `R`, `S`, `T`, `U`\>(`value`, `ab`, `bc`, `cd`, `de`, `ef`, `fg`, `gh`, `hi`, `ij`, `jk`, `kl`, `lm`, `mn`, `no`, `op`, `pq`, `qr`, `rs`, `st`, `tu`): `U`

Defined in: [pipe.ts:300](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/pipe.ts#L300)

Applies a chain of unary functions left-to-right to an initial value, with
each function's output type inferred and propagated to the next.

### Type Parameters

#### A

`A`

The initial value's type. Subsequent overloads add type
  parameters for each intermediate output.

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

#### J

`J`

#### K

`K`

#### L

`L`

#### M

`M`

#### N

`N`

#### O

`O`

#### P

`P`

#### Q

`Q`

#### R

`R`

#### S

`S`

#### T

`T`

#### U

`U`

### Parameters

#### value

`A`

The initial value.

#### ab

`UnaryFn`\<`A`, `B`\>

#### bc

`UnaryFn`\<`B`, `C`\>

#### cd

`UnaryFn`\<`C`, `D`\>

#### de

`UnaryFn`\<`D`, `E`\>

#### ef

`UnaryFn`\<`E`, `F`\>

#### fg

`UnaryFn`\<`F`, `G`\>

#### gh

`UnaryFn`\<`G`, `H`\>

#### hi

`UnaryFn`\<`H`, `I`\>

#### ij

`UnaryFn`\<`I`, `J`\>

#### jk

`UnaryFn`\<`J`, `K`\>

#### kl

`UnaryFn`\<`K`, `L`\>

#### lm

`UnaryFn`\<`L`, `M`\>

#### mn

`UnaryFn`\<`M`, `N`\>

#### no

`UnaryFn`\<`N`, `O`\>

#### op

`UnaryFn`\<`O`, `P`\>

#### pq

`UnaryFn`\<`P`, `Q`\>

#### qr

`UnaryFn`\<`Q`, `R`\>

#### rs

`UnaryFn`\<`R`, `S`\>

#### st

`UnaryFn`\<`S`, `T`\>

#### tu

`UnaryFn`\<`T`, `U`\>

### Returns

`U`

The final value after all functions have been applied. With no
  functions, the input is returned unchanged.

### Remarks

Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
group functions with an intermediate `pipe(...)` call or extract a
sub-chain into a named function.

Every [sync](../../sync/README.md), [async](../../async/README.md), [bridges](../../bridges/README.md), and [do](../../do/README.md)
combinator returns a unary function shaped for `pipe`, so the typical
pattern is `pipe(seed, op1, op2, …)`.

### Example

```ts
import { pipe } from '@konker.dev/neverthrow-r/pipe';

const result = pipe(
  2,
  (n) => n + 1,
  (n) => n * 10,
  (n) => `value: ${n}`,
);
// result is 'value: 30'
```
