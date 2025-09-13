"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { UserRole } from '@/types/auth'

export default function RoleSelector() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role') as UserRole | null
  
  // Effect to store the role in sessionStorage when it's passed in URL
  useEffect(() => {
    if (roleParam && (roleParam === 'buyer' || roleParam === 'seller')) {
      console.log(`Setting role in sessionStorage: ${roleParam}`)
      sessionStorage.setItem('selectedRole', roleParam)
    }
  }, [roleParam])
  
  // Effect to retrieve role from sessionStorage when component mounts
  useEffect(() => {
    const savedRole = sessionStorage.getItem('selectedRole')
    console.log(`Retrieved role from sessionStorage: ${savedRole || 'none'}`)
  }, [])
  
  // No visible UI - this component just handles role persistence
  return null
}