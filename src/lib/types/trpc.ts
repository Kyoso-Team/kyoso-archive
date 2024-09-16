import type { inferAsyncReturnType } from '@trpc/server';
import type { createTRPCContext } from '$lib/server/services';
import type { router } from '$trpc/router';

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;

export type TRPCRouter = typeof router;

export type TRPCRouterIO<Input extends boolean = false> = {
  [K1 in Exclude<keyof TRPCRouter, '_def' | 'createCaller' | 'getErrorShape'>]: {
    [K2 in Exclude<
      keyof TRPCRouter[K1],
      '_def' | 'createCaller' | 'getErrorShape'
    >]: TRPCRouter[K1][K2] extends { _def: { _output_out: any; _input_in: any } }
      ? Input extends true
        ? TRPCRouter[K1][K2]['_def']['_input_in']
        : TRPCRouter[K1][K2]['_def']['_output_out']
      : never;
  };
};
