"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  ArrowPathIcon,
  ArrowRightEndOnRectangleIcon,
  Bars3Icon,
  DocumentTextIcon,
  GlobeAltIcon,
  HomeIcon,
  InboxArrowDownIcon,
  PaperAirplaneIcon,
  PlusIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { auth } from "../services/firebase";

const navigation = [
  { name: "Home", href: "/dashboard", icon: HomeIcon },
  { name: "Transactions", href: "/transactions", icon: ArrowPathIcon },
  { name: "Add Money", href: "/add-money", icon: PlusIcon },
  { name: "Send Money", href: "/send-money", icon: PaperAirplaneIcon },
  { name: "Request Money", href: "/request-money", icon: InboxArrowDownIcon },
  { name: "Group Payments", href: "/group-payments", icon: UserGroupIcon },
  { name: "Contacts", href: "/contacts", icon: UsersIcon },
  { name: "Bill Payments", href: "/bill-payments", icon: DocumentTextIcon },
  { name: "Forex", href: "/forex", icon: GlobeAltIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function NavbarLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <>
      <div>
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>

              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center justify-center">
                  <img
                    alt="SENDIT Logo"
                    src={logo}
                    className="h-10 w-auto mt-4 mr-4"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-y-7">
                  <div className="-mx-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <div key={item.name}>
                          <Link
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={classNames(
                              isActive
                                ? "bg-gray-50 text-black"
                                : "text-gray-700 hover:bg-gray-50 hover:text-black",
                              "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                isActive
                                  ? "text-black"
                                  : "text-gray-400 group-hover:text-black",
                                "size-6 shrink-0"
                              )}
                            />
                            {item.name}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-y-7 mb-6">
                  <div className="-mx-2 space-y-1 ">
                    <div className="hover:cursor-pointer">
                      <Link
                        to={"/profile"}
                        onClick={() => setSidebarOpen(false)}
                        className={classNames(
                          location.pathname === "/profile"
                            ? "bg-gray-50 text-black"
                            : "text-gray-700 hover:bg-gray-50 hover:text-black",
                          "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                        )}
                      >
                        <UserIcon
                          aria-hidden="true"
                          className={classNames(
                            location.pathname === "/profile"
                              ? "text-black"
                              : "text-gray-400 group-hover:text-black",
                            "size-6 shrink-0"
                          )}
                        />
                        Profile
                      </Link>
                    </div>
                    <div className="hover:cursor-pointer">
                      <button
                        className="text-gray-700 hover:bg-gray-50 hover:text-black group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                        onClick={handleLogout}
                      >
                        <ArrowRightEndOnRectangleIcon
                          aria-hidden="true"
                          className="text-gray-400 group-hover:text-black size-6 shrink-0"
                        />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
            <div className="flex h-16 shrink-0 items-center">
              <img alt="SENDIT Logo" src={logo} className="h-10 mt-4 w-auto" />
            </div>
            <div className="flex flex-1 flex-col gap-y-7">
              <div className="-mx-2 space-y-1 ">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <div key={item.name} className="hover:cursor-pointer">
                      <Link
                        to={item.href}
                        className={classNames(
                          isActive
                            ? "bg-gray-50 text-black"
                            : "text-gray-700 hover:bg-gray-50 hover:text-black",
                          "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            isActive
                              ? "text-black"
                              : "text-gray-400 group-hover:text-black",
                            "size-6 shrink-0"
                          )}
                        />
                        {item.name}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-y-7 mb-6">
              <div className="-mx-2 space-y-1 ">
                <div className="hover:cursor-pointer">
                  <Link
                    to={"/profile"}
                    className={classNames(
                      location.pathname === "/profile"
                        ? "bg-gray-50 text-black"
                        : "text-gray-700 hover:bg-gray-50 hover:text-black",
                      "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                    )}
                  >
                    <UserIcon
                      aria-hidden="true"
                      className={classNames(
                        location.pathname === "/profile"
                          ? "text-black"
                          : "text-gray-400 group-hover:text-black",
                        "size-6 shrink-0"
                      )}
                    />
                    Profile
                  </Link>
                </div>
                <div className="hover:cursor-pointer">
                  <button
                    className="text-gray-700 hover:bg-gray-50 hover:text-black group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                    onClick={handleLogout}
                  >
                    <ArrowRightEndOnRectangleIcon
                      aria-hidden="true"
                      className="text-gray-400 group-hover:text-black size-6 shrink-0"
                    />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
          <div className="flex-1 text-sm/6 font-semibold text-gray-900">
            {navigation.find((item) => item.href === location.pathname)?.name ||
              "Dashboard"}
          </div>
        </div>

        <main className="py-6 lg:py-10 lg:pl-72">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
