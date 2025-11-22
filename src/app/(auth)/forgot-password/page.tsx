import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { forgotPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { UrlProvider } from "@/components/url-provider";

export default async function ForgotPassword(props: {
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
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-300">
        <div className="w-full max-w-md rounded-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-8 shadow-2xl">
          <UrlProvider>
            <form className="flex flex-col space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-normal tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">Нууц үг сэргээх</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Бүртгэлтэй юу?{" "}
                  <Link
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:underline transition-all"
                    href="/sign-in"
                  >
                    Нэвтрэх
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Имэйл хаяг
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    required
                    className="w-full h-11 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              <SubmitButton
                formAction={forgotPasswordAction}
                pendingText="Илгээж байна..."
                className="w-full h-11 font-semibold bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0"
              >
                Нууц үг сэргээх
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
