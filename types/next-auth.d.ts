declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: "buyer" | "seller"
    }
  }

  interface User {
    id: string
    role: "buyer" | "seller"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "buyer" | "seller"
  }
}
