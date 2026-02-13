import { Box, Heading, Text, Icon, VStack, Input, Button, Center } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuUpload } from "react-icons/lu"
import { useRef, useState } from "react"

export const ImportTab = () => {
  const { t } = useTranslation('settings')
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      console.log('File dropped:', files[0])
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log('File selected:', e.target.files[0])
    }
  }

  return (
    <Box maxW="4xl">
      <Heading size="lg" mb={2} color="gray.800">{t('import.title')}</Heading>
      <Text color="gray.500" mb={8}>{t('import.description')}</Text>

      <Box
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={isDragging ? "oxygen.500" : "gray.200"}
        bg={isDragging ? "oxygen.50" : "gray.50"}
        borderRadius="xl"
        p={12}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          borderColor: "oxygen.500",
          bg: "oxygen.50"
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Center>
          <VStack gap={4}>
            <Box 
              p={4} 
              bg="white" 
              borderRadius="full" 
              shadow="sm"
              color="oxygen.500"
            >
              <Icon as={LuUpload} boxSize={8} />
            </Box>
            <VStack gap={1}>
              <Heading size="md" color="gray.700">
                {t('import.dropzone.title')}
              </Heading>
              <Text color="gray.500">
                {t('import.dropzone.subtitle')}
              </Text>
            </VStack>
            <Text fontSize="sm" color="gray.400">
              {t('import.dropzone.support')}
            </Text>
            <Button 
              size="sm" 
              variant="outline" 
              colorPalette="oxygen"
              pointerEvents="none" // Click is handled by parent Box
            >
              {t('import.button')}
            </Button>
          </VStack>
        </Center>
        <Input 
          type="file" 
          hidden 
          ref={inputRef} 
          accept=".csv"
          onChange={handleFileChange}
        />
      </Box>
    </Box>
  )
}
