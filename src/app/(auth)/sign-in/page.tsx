import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface LoginProps {
  searchParams: Promise<Message & { redirect?: string }>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const params = await searchParams;
  const redirectPath = params.redirect;

  if ("message" in params) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={params} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(120deg, #d6a4ff 0%, #ffecd2 55%, #ffb07c 100%)' }}>
        <div className="w-full max-w-md rounded-2xl border-0 bg-white/80 backdrop-blur-md p-8 shadow-2xl">
          <form className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-normal tracking-tight font-['Clash_Display']">Нэвтрэх</h1>
              <p className="text-sm text-gray-600">
                Бүртгэл байхгүй юу?{" "}
                <Link
                  className="text-purple-600 font-semibold hover:underline transition-all"
                  href="/sign-up"
                >
                  Бүртгүүлэх
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Имэйл хаяг
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  autoComplete="email"
                  className="w-full h-11 bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Нууц үг
                  </Label>
                  <Link
                    className="text-xs text-gray-500 hover:text-purple-600 hover:underline transition-all"
                    href="/forgot-password"
                  >
                    Нууц үг мартсан?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Нууц үгээ оруулна уу"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {redirectPath && (
              <input type="hidden" name="redirect" value={redirectPath} />
            )}

            <SubmitButton
              className="w-full h-11 font-semibold bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0"
              pendingText="Нэвтэрч байна..."
              formAction={signInAction}
            >
              Нэвтрэх
            </SubmitButton>

            <FormMessage message={params} />
          </form>
        </div>
      </div>
    </>
  );
}