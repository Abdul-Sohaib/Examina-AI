import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <>
    <div className='flex justify-center items-center mt-32'style={{color: 'black'}}>
  <SignIn />
  </div>
  </>
)
};