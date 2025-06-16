import { Layout } from '@/components/Layout'
import { useConnectedStore } from '@/lib/stores/connectedStore'
import { FriendsAnalyticsPreview } from '@/pages/FriendsAnalyticsPage/FriendsAnalyticsPreview'
import { FriendsAnalytics } from './FriendsAnalytics'


      
export const FriendsAnalyticsPage = () => {
  
  const { connected } = useConnectedStore()

  return (
    <Layout>
      <div className="p-8 relative">
        <div className="max-w-5xl mx-auto">
          {!connected && <FriendsAnalyticsPreview />}
          {connected && (
            <FriendsAnalytics />
          )}
        </div>
      </div>
    </Layout>
  )
} 
