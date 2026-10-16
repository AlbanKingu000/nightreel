import { useEffect } from 'react'

const SITE_NAME = 'Nightreel'

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · find tonight's movie`
  }, [title])
}
