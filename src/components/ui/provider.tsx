"use client"

import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

export function Provider(props: ColorModeProviderProps & { system?: typeof defaultSystem }) {
  const { system = defaultSystem, children, ...rest } = props
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...rest}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ColorModeProvider>
    </ChakraProvider>
  )
}
