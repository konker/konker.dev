import * as P from '@konker.dev/effect-ts-prelude';

import type {
  DeleteParameterCommandInput,
  DeleteParametersCommandInput,
  GetParameterCommandInput,
  GetParametersByPathCommandInput,
  GetParametersCommandInput,
  PutParameterCommandInput,
} from '@aws-sdk/client-ssm';
import * as ssmClient from '@aws-sdk/client-ssm';
import { SSMClient } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';

import * as unit from './index';
import { SSMClientDeps } from './index';
import { TAG } from './lib/error';

const ssmMock = mockClient(ssmClient.SSMClient);

describe('aws-client-effect-ssm', () => {
  // eslint-disable-next-line fp/no-let
  let deps: unit.SSMClientDeps;

  beforeAll(() => {
    // eslint-disable-next-line fp/no-mutation
    deps = unit.SSMClientDeps.of({
      ssmClient: new ssmClient.SSMClient({}),
    });
  });

  describe('Error tag', () => {
    it('should export as expected', () => {
      expect(unit.SSM_ERROR_TAG).toEqual('SsmError');
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSSMClientFactory', () => {
    it('should work as expected', async () => {
      expect(unit.defaultSSMClientFactory({})).toBeInstanceOf(SSMClient);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSSMClientFactoryDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = P.pipe(
        unit.SSMClientFactoryDeps,
        P.Effect.map((deps) => deps.ssmClientFactory),
        unit.defaultSSMClientFactoryDeps
      );
      const actual = P.Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(Function);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSSMClientDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = P.pipe(
        unit.SSMClientDeps,
        P.Effect.map((deps) => deps.ssmClient),
        unit.defaultSSMClientDeps({})
      );
      const actual = P.Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(SSMClient);
    });
  });

  // ------------------------------------------------------------------------
  describe('DeleteParameterCommand', () => {
    beforeEach(() => {
      ssmMock.reset();
    });

    it('should work as expected', async () => {
      ssmMock.on(ssmClient.DeleteParameterCommand).resolves({ $metadata: { httpStatusCode: 200 } });

      const params: DeleteParameterCommandInput = {
        Name: 'test-param-name',
      };
      const expected = { $metadata: { httpStatusCode: 200 }, _Params: params };
      const command = P.pipe(unit.DeleteParameterCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(ssmMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      ssmMock.on(ssmClient.DeleteParameterCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: DeleteParameterCommandInput = {
        Name: 'test-param-name',
      };
      const command = P.pipe(unit.DeleteParameterCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(ssmMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('DeleteParametersCommand', () => {
    beforeEach(() => {
      ssmMock.reset();
    });

    it('should work as expected', async () => {
      ssmMock.on(ssmClient.DeleteParametersCommand).resolves({ $metadata: { httpStatusCode: 200 } });

      const params: DeleteParametersCommandInput = {
        Names: ['test-param-name-1', 'test-param-name-2'],
      };
      const expected = { $metadata: { httpStatusCode: 200 }, _Params: params };
      const command = P.pipe(unit.DeleteParametersCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(ssmMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      ssmMock.on(ssmClient.DeleteParametersCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: DeleteParametersCommandInput = {
        Names: ['test-param-name-1', 'test-param-name-2'],
      };
      const command = P.pipe(unit.DeleteParametersCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(ssmMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('GetParameterCommand', () => {
    beforeEach(() => {
      ssmMock.reset();
    });

    it('should work as expected', async () => {
      ssmMock.on(ssmClient.GetParameterCommand).resolves({
        Parameter: { Name: 'test-param-name-1', Type: 'String', Value: 'test-value-1' },
        $metadata: { httpStatusCode: 200 },
      });

      const params: GetParameterCommandInput = {
        Name: 'test-param-name',
      };
      const expected = {
        Parameter: { Name: 'test-param-name-1', Type: 'String', Value: 'test-value-1' },
        $metadata: { httpStatusCode: 200 },
        _Params: params,
      };
      const command = P.pipe(unit.GetParameterCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(ssmMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      ssmMock.on(ssmClient.GetParameterCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: GetParameterCommandInput = {
        Name: 'test-param-name',
      };
      const command = P.pipe(unit.GetParameterCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(ssmMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('GetParametersByPathCommand', () => {
    beforeEach(() => {
      ssmMock.reset();
    });

    it('should work as expected', async () => {
      ssmMock.on(ssmClient.GetParametersByPathCommand).resolves({
        Parameters: [
          { Name: '/foo/bar/test-param-name-1', Type: 'String', Value: 'test-value-1' },
          { Name: 'test-param-name-2', Type: 'String', Value: 'test-value-2' },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const params: GetParametersByPathCommandInput = { Path: '/foo/bar' };
      const expected = {
        Parameters: [
          { Name: '/foo/bar/test-param-name-1', Type: 'String', Value: 'test-value-1' },
          { Name: 'test-param-name-2', Type: 'String', Value: 'test-value-2' },
        ],
        $metadata: { httpStatusCode: 200 },
        _Params: params,
      };
      const command = P.pipe(
        unit.GetParametersByPathCommandEffect(params),
        P.Effect.provideService(SSMClientDeps, deps)
      );
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(ssmMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      ssmMock.on(ssmClient.GetParametersByPathCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: GetParametersByPathCommandInput = { Path: '/foo/bar' };
      const command = P.pipe(
        unit.GetParametersByPathCommandEffect(params),
        P.Effect.provideService(SSMClientDeps, deps)
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(ssmMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('GetParametersCommand', () => {
    beforeEach(() => {
      ssmMock.reset();
    });

    it('should work as expected', async () => {
      ssmMock.on(ssmClient.GetParametersCommand).resolves({
        Parameters: [
          { Name: 'test-param-name-1', Type: 'String', Value: 'test-value-1' },
          { Name: 'test-param-name-2', Type: 'String', Value: 'test-value-2' },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const params: GetParametersCommandInput = {
        Names: ['test-param-name-1', 'test-param-name-2'],
      };
      const expected = {
        Parameters: [
          { Name: 'test-param-name-1', Type: 'String', Value: 'test-value-1' },
          { Name: 'test-param-name-2', Type: 'String', Value: 'test-value-2' },
        ],
        $metadata: { httpStatusCode: 200 },
        _Params: params,
      };
      const command = P.pipe(unit.GetParametersCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(ssmMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      ssmMock.on(ssmClient.GetParametersCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: GetParametersCommandInput = { Names: ['test-param-name-1', 'test-param-name-2'] };
      const command = P.pipe(unit.GetParametersCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(ssmMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('PutParameterCommand', () => {
    beforeEach(() => {
      ssmMock.reset();
    });

    it('should work as expected', async () => {
      ssmMock.on(ssmClient.PutParameterCommand).resolves({
        $metadata: { httpStatusCode: 201 },
      });

      const params: PutParameterCommandInput = {
        Name: 'test-param-name-2',
        Type: 'String',
        Value: 'test-value-2',
      };
      const expected = { $metadata: { httpStatusCode: 201 }, _Params: params };
      const command = P.pipe(unit.PutParameterCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(ssmMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      ssmMock.on(ssmClient.PutParameterCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: PutParameterCommandInput = {
        Name: 'test-param-name-2',
        Type: 'String',
        Value: 'test-value-2',
      };
      const command = P.pipe(unit.PutParameterCommandEffect(params), P.Effect.provideService(SSMClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(ssmMock.calls().length).toEqual(1);
    });
  });
});