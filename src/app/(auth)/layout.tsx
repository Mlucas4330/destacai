import AuthLayout from '@/shared/components/AuthLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>
}
