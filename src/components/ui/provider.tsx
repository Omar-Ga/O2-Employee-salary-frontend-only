"use client"

import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

export function Provider(props: ColorModeProviderProps & { system?: any }) {
  const { system = defaultSystem, ...rest } = props
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...rest} />
    </ChakraProvider>
  )
}
