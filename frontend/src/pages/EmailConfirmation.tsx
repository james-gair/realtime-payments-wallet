function EmailConfirmation() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 max-w-sm mx-auto">
      <h1>Email Sent</h1>
      <h2>
        A verification link has been sent to your email. Please check your inbox
        to verify your account.
      </h2>
    </div>
  );
}

export default EmailConfirmation;
