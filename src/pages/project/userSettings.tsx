import Header from "@/src/components/layouts/header";
import { Alert } from "@/src/components/ui/alert";
import { useSession, signOut } from "next-auth/react";
import { LogOut, KeySquare } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { PasswordForm } from "@/src/features/auth/components/PasswordForm";

const instructionItems = [
  {
    name: "LogOut",
    description: "Click button to safely end your current session now",
    onClick: () =>
      signOut({
        callbackUrl: "/auth/sign-in",
      }),
    icon: LogOut,
  },
];

export default function UserSettingPage() {
  const session = useSession();

  return (
    <div className="md:container">
      <Header title="User Settings" />
      <Alert>
        <div className=" flex items-center justify-between ">
          <div className="text-lg font-semibold">
            {session.data?.user?.name}
          </div>
          <Avatar className="h-20 w-20">
            <AvatarImage src={session.data?.user?.image ?? undefined} />
            <AvatarFallback className="h-20 w-20 text-2xl">
              {session.data?.user?.name
                ? session.data.user.name
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .concat("")
                : null}
            </AvatarFallback>
          </Avatar>
        </div>
        <ul
          role="list"
          className="mt-6 divide-y divide-gray-200 border-b border-t border-gray-200"
        >
          <li>
            <div className="group relative flex items-start space-x-3 py-4">
              <div className="flex-shrink-0">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600">
                  <KeySquare className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="min-w-0 flex-1 items-center">
                <div className="text-base font-medium text-gray-900">
                  Change Password
                  <PasswordForm />
                </div>
              </div>
            </div>
          </li>
          {instructionItems.map((item, itemIdx) => (
            <li key={itemIdx}>
              <div className="group relative flex items-start space-x-3 py-4">
                <div className="flex-shrink-0">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600">
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 items-center">
                  <div className="text-sm font-medium text-gray-900">
                    <a
                      onClick={() => void item.onClick()}
                      className="cursor-pointer"
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      {item.name}
                    </a>
                  </div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Alert>
    </div>
  );
}
