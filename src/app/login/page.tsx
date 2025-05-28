
'use client'
import LoginProviderForm from "@/components/LoginProviderForm";

export default function LoginPage() {
  return (
    <div className="hero bg-base-100 h-full ">
      <div className="hero-content flex-col lg:flex-row-reverse bg-neutral rounded-lg">
        <div className="text-center lg:text-left text-neutral-content">
          <h1 className="text-2xl lg:text-5xl font-bold">Welcome to Arc-Comp!</h1>
          <div className="flex flex-col gap-3">
          <p>
            Arc-Comp is a free Archery Tournament management solution, inspired by the needs of Irish Field Archery Federation clubs.
          </p>
          <p>
            To use the software you must be logged in, please use one of the options provided.
          </p>
          <p>
            If you would like to create a <span className="font-bold">username/password</span>, please choose Auth0 as your provider.
          </p>
          </div>
        </div>
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl text-primary-content">
          <div className="card-body">
              <LoginProviderForm/>
          </div>
        </div>
      </div>
    </div>
  );
}
