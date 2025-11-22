import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { UrlProvider } from "@/components/url-provider";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(120deg, #d6a4ff 0%, #ffecd2 55%, #ffb07c 100%)' }}>
        <div className="w-full max-w-md rounded-2xl border-0 bg-white/80 backdrop-blur-md p-8 shadow-2xl">
          <UrlProvider>
            <form className="flex flex-col space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-normal tracking-tight font-['Clash_Display']">Бүртгүүлэх</h1>
                <p className="text-sm text-gray-600">
                  Бүртгэлтэй юу?{" "}
                  <Link
                    className="text-purple-600 font-semibold hover:underline transition-all"
                    href="/sign-in"
                  >
                    Нэвтрэх
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                    Бүтэн нэр
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Таны нэр"
                    required
                    className="w-full h-11 bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

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
                    className="w-full h-11 bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Нууц үг
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Нууц үгээ оруулна уу"
                    minLength={6}
                    required
                    className="w-full h-11 bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <SubmitButton
                formAction={signUpAction}
                pendingText="Бүртгүүлж байна..."
                className="w-full h-11 font-semibold bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0"
              >
                Бүртгүүлэх
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </UrlProvider>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
