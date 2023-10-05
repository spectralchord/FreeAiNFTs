import { useState } from 'react'

type CopiedValue = string | null
type IsCopiedState = boolean
type CopyFn = (text: string) => Promise<boolean>

export function useClipboard(): [CopiedValue, CopyFn, IsCopiedState] {
    const [copiedText, setCopiedText] = useState<CopiedValue>(null)
    const [isCopied, setIsCopied] = useState(false)

    const copy: CopyFn = async text => {
        if (!navigator?.clipboard) {
            console.warn('Clipboard not supported')
            return false
        }

        try {
            await navigator.clipboard.writeText(text)
            setCopiedText(text)
            setIsCopied(true)
            setTimeout(() => {
                setIsCopied(false)
            }, 1000)
            return true
        } catch (error) {
            console.warn('Copy failed', error)
            setCopiedText(null)
            setIsCopied(false)
            return false
        }
    }

    return [copiedText, copy, isCopied]
}