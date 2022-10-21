import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SiweMessage } from 'siwe';
import { useAccount, useSigner } from 'wagmi';
import axios from 'axios';

type Props = { color: string };

const Upvote = ({ color }: Props) => {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const queryClient = useQueryClient();
  const { data: colorCount } = useQuery(['count', color], async () => {
    const { data } = await axios.get(`/api/current-count?color=${color}`);
    return data.count;
  });

  const { mutateAsync } = useMutation(
    async (vars: { message: string; signature: string }) => {
      const { message, signature } = vars;
      const { data } = await axios.post('/api/count', {
        message,
        signature,
        color,
      });
      queryClient.setQueryData(['count', color], data.count);
    }
  );

  async function createSiweMessage(address, statement) {
    const res = await axios.get('/api/nonce');
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement,
      uri: window.location.origin,
      version: '1',
      chainId: 1,
      nonce: res.data,
    });
    return message.prepareMessage();
  }

  const sign = async () => {
    try {
      const message = await createSiweMessage(
        address,
        `I love the beautiful color #${color}`
      );

      const signature = await signer.signMessage(message);
      await mutateAsync({ message, signature });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div onClick={sign}>
      Count: {colorCount} {'Upvote❤️'}
    </div>
  );
};

export default Upvote;
