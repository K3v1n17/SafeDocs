"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Message = {
  sender: "me" | "other"
  text: string
  timestamp: number
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const socketRef = useRef<WebSocket | null>(null)
  const sentMessagesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001")
    socketRef.current = socket

    socket.onopen = () => {
      console.log("Conectado al servidor WebSocket")
    }

    socket.onmessage = (event) => {
      const messageKey = `${event.data}_${Date.now()}`
      
      // Solo verificar eco si el mensaje se envió muy recientemente (últimos 1000ms)
      const recentSentMessages = Array.from(sentMessagesRef.current).filter(key => {
        const timestamp = parseInt(key.split('_').pop() || '0')
        return Date.now() - timestamp < 1000
      })
      
      const isEcho = recentSentMessages.some(key => key.startsWith(event.data + '_'))
      
      if (!isEcho) {
        setMessages((prev) => [...prev, { 
          sender: "other", 
          text: event.data,
          timestamp: Date.now()
        }])
      }
    }

    socket.onclose = () => {
      console.log("Desconectado del servidor WebSocket")
    }

    socket.onerror = (err) => {
      console.error("WebSocket error:", err)
    }

    return () => {
      socket.close()
    }
  }, [])

  const sendMessage = () => {
    if (socketRef.current && input.trim()) {
      const messageKey = `${input}_${Date.now()}`
      
      // Registrar el mensaje enviado con timestamp
      sentMessagesRef.current.add(messageKey)
      
      // Limpiar mensajes antiguos del registro (más de 5 segundos)
      setTimeout(() => {
        sentMessagesRef.current.delete(messageKey)
      }, 5000)
      
      socketRef.current.send(input)
      setMessages((prev) => [...prev, { 
        sender: "me", 
        text: input,
        timestamp: Date.now()
      }])
      setInput("")
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Anuncios en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2 bg-muted/10">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded max-w-[70%] ${
                  msg.sender === "me"
                    ? "bg-blue-500 text-white ml-auto text-right"
                    : "bg-gray-300 text-black mr-auto text-left"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="mt-4 flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage()
              }}
            />
            <Button onClick={sendMessage}>Enviar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}