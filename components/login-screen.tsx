"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon } from "lucide-react"

interface LoginScreenProps {
  onLogin: (password: string) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "lf25") {
      onLogin(password)
    } else {
      setError(true)
      setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <LockIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Lost and Found Logger</CardTitle>
          <CardDescription>Enter the password to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={error ? "border-red-500" : ""}
                  autoComplete="off"
                />
                {error && <p className="text-sm text-red-500">Incorrect password. Please try again.</p>}
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          The system will automatically lock after 3 minutes of inactivity.
        </CardFooter>
      </Card>
    </div>
  )
}

