import { Check, Copy, Download, ExternalLink, FileText, FileX2, Presentation, Volume2, VolumeX, X } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import MermaidRenderer from './MermaidRenderer';

function MessageBubble({ role, content, images }) {
  const isUser = role === "user"
  const [lightBox, setLightBox] = useState(null)
  const [copiedCode, setCopiedCode] = useState("")
  const [isCopiedMsg, setIsCopiedMsg] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [downloadingImg, setDownloadingImg] = useState(null)
  const synthRef = useRef(window.speechSynthesis)

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
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      return;
    }

    synthRef.current.cancel()

    // Clean markdown before speaking
    const cleanText = (content || "")
      .replace(/```[\s\S]*?```/g, 'Code block.')
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/📥 \[Download.*?\]\(.*?\)/gi, '')
      .trim()

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.05
    utterance.pitch = 1.0

    const voices = synthRef.current.getVoices()
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')))
    if (naturalVoice) utterance.voice = naturalVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  const handleDownloadImage = async (imgUrl, defaultName = `cortex-image-${Date.now()}.png`) => {
    try {
      setDownloadingImg(imgUrl)
      const res = await fetch(imgUrl)
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
      window.open(imgUrl, '_blank')
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
              const isPdf = href?.includes(".pdf") || String(children).toLowerCase().includes("pdf")
              const isPpt = href?.includes(".pptx") || String(children).toLowerCase().includes("ppt")

              if (isPdf || isPpt) {
                return (
                  <a
                    href={href}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 my-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition no-underline cursor-pointer"
                  >
                    {isPdf ? <FileText size={15} /> : <Presentation size={15} />}
                    <span>{children}</span>
                    <Download size={13} className="ml-0.5 opacity-90" />
                  </a>
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
