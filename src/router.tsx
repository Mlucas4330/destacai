import { createMemoryRouter, Outlet, redirect } from "react-router-dom";
import SignIn from "@/pages/SignIn"
import AddJob from "@/features/jobs/components/AddJob";
import GenerateCV from "@/features/jobs/components/GenerateCV";
import SignUp from "@/pages/SignUp";
import VerifyCode from "@/pages/VerifyCode";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Config from "@/pages/Config";
import { STORAGE_KEYS } from "@/shared/constants";
import NoCvState from "./pages/NoCvState";
import NavBar from "@/shared/components/NavBar";
import Spinner from "@/shared/components/Spinner";

export const router = createMemoryRouter([
  {
    path: '/',
    loader: async () => {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.PENDING_VERIFICATION,
        STORAGE_KEYS.PENDING_DESCRIPTION,
      ])
      const pendingVerif = result[STORAGE_KEYS.PENDING_VERIFICATION]
      const pendingJob = result[STORAGE_KEYS.PENDING_DESCRIPTION]

      if (pendingVerif) return redirect('/verify-code')
      if (pendingJob) return redirect('/add-job')
      return redirect('/jobs')
    },
    element: <Spinner />
  },
  {
    path: '/jobs',
    loader: async () => {
      // const { isSignedIn } = useAuthStore()
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.PENDING_DESCRIPTION,
      ])
      const pendingJob = result[STORAGE_KEYS.PENDING_DESCRIPTION]
      // const { guestCvR2Key } = useGuestContext()

      // const { data: user } = useAuthUser()
      // const hasCv = isSignedIn ? (user?.hasCv ?? false) : guestCvR2Key !== null

      if (!hasCv) return redirect('/no-cv')
      if (isSignedIn) return redirect('/auth-jobs')
      return redirect('/guest-jobs')
    },
    element: <Spinner />
  },
  {
    element: <NavBar />,
    children: [
      { path: '/add-job', element: <AddJob /> },
      { path: '/generate/:jobId', element: <GenerateCV /> },
      { path: '/config', element: <Config /> },
    ],
  },
  {
    children: [
      { path: '/sign-in', element: <SignIn /> },
      { path: '/sign-up', element: <SignUp /> },
      { path: '/verify-code', element: <VerifyCode /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/no-cv', element: <NoCvState /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },

    ],
  },
])