import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"
import { colors } from "./colors"
import { fonts } from "./fonts"

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors,
      fonts,
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.oxygen.500}" },
          contrast: { value: "white" },
          fg: { value: "{colors.oxygen.700}" },
          muted: { value: "{colors.oxygen.100}" },
          subtle: { value: "{colors.oxygen.200}" },
          emphasized: { value: "{colors.oxygen.300}" },
          focusRing: { value: "{colors.oxygen.500}" },
        },
      },
    },
  },
  globalCss: {
    "html[dir='rtl'], body[dir='rtl']": {
      fontSize: "108%",
      lineHeight: "1.7",
    },
  },
})

export const system = createSystem(defaultConfig, customConfig)
