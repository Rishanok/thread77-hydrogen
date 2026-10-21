import {storefrontRedirect} from '@shopify/hydrogen';
import {createRequestHandler} from '@shopify/hydrogen/oxygen';
import {waitUntil as vercelWaitUntil} from '@vercel/functions';
import {createHydrogenRouterContext} from '~/lib/context';

/**
 * Maps process.env to Env object on Vercel where bindings come from process.env.
 */
function getEnv(env?: Env): Env {
  if (env?.SESSION_SECRET) return env;
  return (process.env as unknown as Env) || ({} as Env);
}

/**
 * Creates an ExecutionContext for Vercel environments using @vercel/functions waitUntil.
 */
function getExecutionContext(ctx?: ExecutionContext): ExecutionContext {
  if (ctx?.waitUntil) return ctx;
  return {
    waitUntil: (p: Promise<unknown>) => {
      try {
        vercelWaitUntil(p);
      } catch {
        // Fallback when outside active invocation context
      }
    },
    passThroughOnException: () => {},
  } as ExecutionContext;
}

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env?: Env,
    executionContext?: ExecutionContext,
  ): Promise<Response> {
    try {
      const resolvedEnv = getEnv(env);
      const resolvedContext = getExecutionContext(executionContext);

      const hydrogenContext = await createHydrogenRouterContext(
        request,
        resolvedEnv,
        resolvedContext,
      );

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        // eslint-disable-next-line import/no-unresolved
        build: await import('virtual:react-router/server-build'),
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
