import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: `/mis-eventos/${context.params?.id}`,
      permanent: false,
    },
  };
};

export default function RedirectPage() {
  return null;
}
