import {
  QueryClient,
  defaultShouldDehydrateQuery,
  environmentManager,
} from "@tanstack/react-query"

export const STALE_TIME_MS = 60 * 1000

export const STALE_TIME_SECONDS = STALE_TIME_MS / 1000

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        shouldRedactErrors: (_error) => {
          return false
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient()
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
