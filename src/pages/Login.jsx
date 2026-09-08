import { ArrowRight, TrainFront } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DuskCorridor from '../components/marketing/DuskCorridor'
import Button from '../components/ui/Button'
import { Dot } from '../components/ui/Chip'
import { Label, TextInput } from '../components/ui/Field'
import { operator, system } from '../data/smartRail'

export default function Login() {
  const navigate = useNavigate()
  const [staffId, setStaffId] = useState(operator.email)
  const [password, setPassword] = useState('smartrail-demo')

  /* Prototype authentication: any non-empty pair opens the workspace. */
  const submit = (event) => {
    event.preventDefault()
    if (staffId.trim() && password.trim()) navigate('/app/dashboard')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface lg:flex-row">
      {/* Photographic panel */}
      <div className="relative isolate min-h-[42vh] overflow-hidden lg:min-h-dvh lg:w-[58%]">
        <DuskCorridor className="absolute inset-0 -z-10 size-full" />

        <div className="flex h-full flex-col justify-between p-6 lg:p-10">
          <p className="flex items-center gap-2 text-label-md uppercase tracking-[0.16em] text-white/90">
            <Dot tone="accent" />
            Operational Network Access
          </p>

          <div className="max-w-lg">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded bg-accent">
                <TrainFront className="size-6 text-ink" strokeWidth={2} />
              </span>
              <span className="text-[38px] font-bold leading-none tracking-[-0.02em] text-white">
                {system.name}
              </span>
            </div>
            <p className="mt-4 text-headline-sm text-white">
              {system.expansion}
            </p>
            <span className="mt-4 block h-px w-20 bg-accent" />
            <p className="mt-4 text-body-lg text-white/80">
              Intelligent maintenance planning for a more coordinated railway
              network.
            </p>
          </div>
        </div>
      </div>

      {/* Authentication pane */}
      <div className="flex flex-1 flex-col justify-between bg-surface p-6 lg:p-10">
        <div />

        <form onSubmit={submit} className="mx-auto w-full max-w-sm">
          <p className="text-label-md uppercase tracking-[0.12em] text-accent-hover">
            Authentication
          </p>
          <h1 className="mt-3 text-display-lg text-ink">
            Sign in to {system.name}
          </h1>
          <p className="mt-1.5 text-body-lg text-ink-muted">
            Access the maintenance planning workspace.
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <Label htmlFor="staff-id" className="mb-1.5">
                Staff ID / Official Email
              </Label>
              <TextInput
                id="staff-id"
                name="staffId"
                type="text"
                autoComplete="username"
                className="h-10"
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="mb-1.5"
                hint={
                  <button
                    type="button"
                    className="cursor-pointer text-body-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                  >
                    Forgot password?
                  </button>
                }
              >
                Password
              </Label>
              <TextInput
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" size="lg" full className="mt-2">
              Sign in
              <ArrowRight className="size-4" strokeWidth={2} />
            </Button>

            <p className="pt-1 text-center text-body-md text-ink-subtle">
              Secure access for authorized personnel.
            </p>
          </div>
        </form>

        <footer className="mx-auto flex w-full max-w-sm items-center justify-between border-t border-line pt-4 text-body-sm text-ink-subtle">
          <span>{system.name} Systems</span>
          <span>Enterprise Platform</span>
        </footer>
      </div>
    </div>
  )
}
