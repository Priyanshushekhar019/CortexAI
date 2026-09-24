import { Check, Code2, Copy, Download, ExternalLink, Eye, FileText, FileX2, Layers, Loader2, Presentation, Sparkles, Volume2, VolumeX, X } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import MermaidRenderer from './MermaidRenderer';
import { setArtifacts } from '../redux/messageSlice';
import { extractCodeArtifacts } from '../utils/extractCodeArtifacts';

const resolveFileUrl = (url) => {
  if (!url) return '';
  const serverBase = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
  const cleanBase = serverBase.replace(/\/$/, '');

  if (url.startsWith('/')) {
    return `${cleanBase}${url}`;
  }

  if (url.includes('localhost:8000') || url.includes('localhost:8003') || url.includes('127.0.0.1:8000') || url.includes('127.0.0.1:8003')) {
    try {
      const parsed = new URL(url);
      return `${cleanBase}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  return url;
};

function MessageBubble({ role, content, images, artifacts = [] }) {
  const isUser = role === "user"
  const dispatch = useDispatch()
  const [lightBox, setLightBox] = useState(null)
  const [copiedCode, setCopiedCode] = useState("")
  const [isCopiedMsg, setIsCopiedMsg] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [downloadingImg, setDownloadingImg] = useState(null)
  const [downloadingFile, setDownloadingFile] = useState(null)
  const synthRef = useRef(window.speechSynthesis)

  const effectiveArtifacts = (artifacts && artifacts.length > 0)
    ? artifacts
    : extractCodeArtifacts(content)

  const hasArtifacts = !isUser && effectiveArtifacts && effectiveArtifacts.length > 0 && effectiveArtifacts[0]?.files?.length > 0

  const handleOpenArtifact = () => {
    if (hasArtifacts) {
      dispatch(setArtifacts(effectiveArtifacts))
    }
  }

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode("")
    }, 2000)
  }

  const copyMessageText = async () => {
    await navigator.clipboard.writeText(content || "")
    setIsCopiedMsg(true)
    setTimeout(() => setIsCopiedMsg(false), 2000)
  }

  const toggleSpeak = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.")
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.resume()

    // Clean markdown cleanly before speaking
    const cleanText = (content || "")
      .replace(/```[\s\S]*?```/g, 'Code block.')
      .replace(/!\[.*?\]\(.*?\)/g, 'Image.')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/📥\s*Download.*$/gim, '')
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.lang = 'en-US'

    const voices = window.speechSynthesis.getVoices()
    if (voices && voices.length > 0) {
      const naturalVoice = voices.find(v => 
        v.lang?.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Guy') || v.name.includes('Aria'))
      ) || voices.find(v => v.lang?.startsWith('en')) || voices[0]
      if (naturalVoice) utterance.voice = naturalVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e)
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
    window._activeUtterance = utterance
  }

  const handleDownloadFile = async (rawUrl, defaultName = 'download.pdf') => {
    const targetUrl = resolveFileUrl(rawUrl)
    try {
      setDownloadingFile(rawUrl)
      const res = await fetch(targetUrl, { mode: 'cors' })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      // Determine clean filename
      let filename = defaultName
      try {
        const parsed = new URL(targetUrl)
        const parts = parsed.pathname.split('/')
        const last = parts[parts.length - 1]
        if (last && last.includes('.')) {
          filename = decodeURIComponent(last)
        }
      } catch (_) {}

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.warn("Direct blob download failed, falling back to window.open:", err)
      window.open(targetUrl, '_blank')
    } finally {
      setDownloadingFile(null)
    }
  }

  const handleDownloadImage = async (imgUrl, defaultName = `cortex-image-${Date.now()}.png`) => {
    const targetUrl = resolveFileUrl(imgUrl)
    try {
      setDownloadingImg(imgUrl)
      const res = await fetch(targetUrl, { mode: 'cors' })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = defaultName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn("Direct blob download failed, opening in new tab:", err)
      window.open(targetUrl, '_blank')
    } finally {
      setDownloadingImg(null)
    }
  }

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} my-2 group`}>
      <div className={`w-fit max-w-[94vw] md:max-w-[76%] px-4 py-3 rounded-2xl break-words overflow-hidden leading-relaxed shadow-sm ${
        isUser
          ? "bg-gradient-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm"
          : "bg-white/[0.03] border border-white/[0.07] text-slate-200 rounded-tl-sm"
      }`}>

        {/* Display attached images with dedicated download overlay */}
        {images && images.length > 0 && (
          <div className='flex flex-wrap gap-3 mb-4'>
            {images.map((img, i) => (
              <div key={i} className='relative group/img rounded-xl overflow-hidden border border-white/10'>
                <img
                  src={img}
                  onClick={() => setLightBox(img)}
                  loading="lazy"
                  onError={(e) => e.currentTarget.remove()}
                  className="w-48 h-36 rounded-xl object-cover cursor-zoom-in hover:opacity-95 transition"
                />
                <button
                  onClick={() => handleDownloadImage(img, `cortex-generated-${i + 1}.png`)}
                  className='absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black/90 text-white text-[11px] font-medium backdrop-blur-sm border border-white/20 shadow-lg transition cursor-pointer'
                  title="Download Image"
                >
                  <Download size={12} />
                  <span>{downloadingImg === img ? 'Saving...' : 'Download'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className='text-2xl font-bold mt-4 mb-3 text-white'>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className='text-xl font-semibold mt-3.5 mb-2 text-slate-100'>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className='text-lg font-semibold mt-3 mb-2 text-indigo-300'>{children}</h3>
            ),
            p: ({ children }) => (
              <p className='mb-2.5 whitespace-pre-wrap break-words'>{children}</p>
            ),
            ul: ({ children }) => (
              <ul className='list-disc pl-5 space-y-1 my-2'>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className='list-decimal pl-5 space-y-1 my-2'>{children}</ol>
            ),
            table: ({ children }) => (
              <div className='overflow-x-auto my-4'>
                <table className='min-w-full border border-white/10 text-sm'>
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className='border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-300'>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className='border border-white/10 px-3 py-2'>
                {children}
              </td>
            ),
            a: ({ href, children }) => {
              const hrefLower = (href || '').toLowerCase()
              const textLower = String(children || '').toLowerCase()

              const isPdf = hrefLower.includes('.pdf') || textLower.includes('pdf')
              const isPpt = hrefLower.includes('.ppt') || hrefLower.includes('.pptx') || textLower.includes('ppt') || textLower.includes('presentation')
              const isDownloadable = isPdf || isPpt || hrefLower.includes('/api/files/') || textLower.includes('download')

              if (isDownloadable) {
                const isDownloading = downloadingFile === href
                const ext = isPdf ? '.pdf' : isPpt ? '.pptx' : ''
                const fallbackName = `cortex-${isPdf ? 'document' : isPpt ? 'presentation' : 'file'}-${Date.now()}${ext}`

                return (
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(href, fallbackName)}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 my-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition cursor-pointer disabled:opacity-75 select-none"
                    title="Download file directly to your device for offline use"
                  >
                    {isDownloading ? (
                      <Loader2 size={15} className="animate-spin text-white" />
                    ) : isPdf ? (
                      <FileText size={15} />
                    ) : isPpt ? (
                      <Presentation size={15} />
                    ) : (
                      <FileText size={15} />
                    )}
                    <span>{isDownloading ? "Saving to device..." : children}</span>
                    {!isDownloading && <Download size={13} className="ml-0.5 opacity-90" />}
                  </button>
                )
              }

              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline inline-flex items-center gap-1 hover:text-indigo-300"
                >
                  {children}
                  <ExternalLink size={13} />
                </a>
              )
            },
            code: ({ className, children }) => {
              const value = String(children).trim()

              if (!className) {
                return (
                  <code className='px-1.5 py-0.5 rounded bg-white/10 text-indigo-200 text-xs font-mono'>
                    {value}
                  </code>
                )
              }

              const language = className.replace("language-", "").toLowerCase()

              if (language === 'mermaid' || language === 'diagram') {
                return <MermaidRenderer chart={value} />
              }

              return (
                <div className='my-3.5 overflow-hidden rounded-xl border border-white/10 bg-[#111318]'>
                  <div className='flex items-center justify-between bg-[#1b1d24] border-b border-white/10 px-4 py-2'>
                    <span className='uppercase text-xs text-slate-400 font-mono'>
                      {language}
                    </span>
                    <button
                      className='flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer'
                      onClick={() => copyCode(value)}
                    >
                      {copiedCode === value ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    wrapLongLines
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      padding: "16px",
                      background: "#0d1117",
                      fontSize: "13px",
                    }}
                  >
                    {value}
                  </SyntaxHighlighter>
                </div>
              )
            },
            img: ({ src, alt }) => {
              if (!src) return null;
              return (
                <div className='relative group/inlineimg my-3 inline-block rounded-2xl overflow-hidden border border-white/10 bg-black/20'>
                  <img
                    src={src}
                    alt={alt || "Generated Image"}
                    onClick={() => setLightBox(src)}
                    loading="lazy"
                    onError={(e) => e.currentTarget.remove()}
                    className="max-w-md w-full rounded-2xl object-contain cursor-zoom-in hover:opacity-95 transition"
                  />
                  <div className='absolute bottom-3 right-3 flex items-center gap-2'>
                    <button
                      onClick={() => handleDownloadImage(src, `${(alt || "cortex-generated").toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`)}
                      className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-xl transition cursor-pointer'
                      title="Download Image to Computer"
                    >
                      <Download size={13} />
                      <span>{downloadingImg === src ? 'Saving...' : 'Download Image'}</span>
                    </button>
                  </div>
                </div>
              )
            }
          }}
        >
          {content}
        </Markdown>

        {/* Interactive Artifact / Code Sandbox Opener Card */}
        {hasArtifacts && (
          <div className='mt-3.5 pt-3 border-t border-white/10'>
            <div
              onClick={handleOpenArtifact}
              className='group/art p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-900/20 hover:from-indigo-900/50 hover:via-purple-900/40 hover:to-indigo-800/30 border border-indigo-500/30 hover:border-indigo-400/50 flex items-center justify-between gap-3 shadow-lg shadow-indigo-950/40 transition duration-200 cursor-pointer'
              title="Click to load this code in the Artifact Sandbox"
            >
              <div className='flex items-center gap-2.5 min-w-0'>
                <div className='w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 group-hover/art:scale-105 transition'>
                  <Code2 className="text-indigo-400" size={16} />
                </div>
                <div className='min-w-0'>
                  <div className='text-xs font-semibold text-indigo-200 group-hover/art:text-white truncate'>
                    {effectiveArtifacts[0]?.title || "Generated Project"}
                  </div>
                  <div className='text-[11px] text-slate-400'>
                    {(effectiveArtifacts[0]?.files || []).length} project file{(effectiveArtifacts[0]?.files || []).length !== 1 ? 's' : ''} available to view & live-edit
                  </div>
                </div>
              </div>

              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenArtifact()
                }}
                className='px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-medium transition flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/30 cursor-pointer select-none'
              >
                <Eye size={13} />
                <span>Open in Sandbox</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Action Bar (Copy & Voice Read-Aloud) for Assistant Messages */}
      {!isUser && content && (
        <div className='flex items-center gap-2 mt-1.5 px-2 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity duration-200'>
          <button
            onClick={toggleSpeak}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:bg-white/[0.05] hover:text-slate-300 transition cursor-pointer ${
              isSpeaking ? 'text-indigo-400 font-medium' : ''
            }`}
            title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={13} />
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-2 bg-indigo-400 animate-pulse"></span>
                  <span className="w-1 h-3 bg-indigo-400 animate-bounce"></span>
                  <span className="w-1 h-1.5 bg-indigo-400 animate-pulse"></span>
                </span>
              </>
            ) : (
              <>
                <Volume2 size={13} />
                <span>Listen</span>
              </>
            )}
          </button>

          <button
            onClick={copyMessageText}
            className='flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:bg-white/[0.05] hover:text-slate-300 transition cursor-pointer'
            title="Copy entire response"
          >
            {isCopiedMsg ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {lightBox && (
        <div className='fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6'>
          <div className='absolute top-5 right-5 flex items-center gap-3'>
            <button
              onClick={() => handleDownloadImage(lightBox, `cortex-fullscreen-${Date.now()}.png`)}
              className='flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition cursor-pointer'
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            <button
              className='text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition cursor-pointer'
              onClick={() => setLightBox(null)}
            >
              <X size={18} />
            </button>
          </div>
          <img
            src={lightBox}
            alt="Fullscreen Preview"
            className="max-w-[92vw] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  )
}

export default MessageBubble
