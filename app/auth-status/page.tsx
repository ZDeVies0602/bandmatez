import { createClient } from '@/utils/supabase/server';

export default async function AuthStatus() {
  const supabase = await createClient();
  
  // Get session and user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Status</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Status:</h2>
          {sessionError ? (
            <div className="text-red-600">Error: {sessionError.message}</div>
          ) : session ? (
            <div className="text-green-600">✅ Session exists</div>
          ) : (
            <div className="text-yellow-600">⚠️ No session</div>
          )}
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">User Status:</h2>
          {userError ? (
            <div className="text-red-600">Error: {userError.message}</div>
          ) : user ? (
            <div className="text-green-600">✅ User authenticated</div>
          ) : (
            <div className="text-yellow-600">⚠️ No user</div>
          )}
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">User Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-4 space-x-4">
        <a 
          href="/Signin" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign In
        </a>
        <a 
          href="/test-auth" 
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Auth
        </a>
        <a 
          href="/test-auth-client" 
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Auth Client
        </a>
      </div>
    </div>
  );
} 