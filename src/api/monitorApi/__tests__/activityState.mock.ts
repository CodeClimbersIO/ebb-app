import { ActivityState, ActivityStateType } from '../../../db/monitor/activityStateRepo'

export const mockActivityStates = (): ActivityState[] => {
  return [
    {
      'id': 15650,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:03:28.231423Z',
      'end_time': '2025-02-07T17:03:58.231424Z',
      'created_at': '2025-02-07 17:03:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15651,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T17:03:58.231424Z',
      'end_time': '2025-02-07T17:04:28.235608Z',
      'created_at': '2025-02-07 17:03:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15652,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:04:28.235608Z',
      'end_time': '2025-02-07T17:04:58.235117Z',
      'created_at': '2025-02-07 17:04:28',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15653,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:04:58.235117Z',
      'end_time': '2025-02-07T17:05:28.232851Z',
      'created_at': '2025-02-07 17:04:58',
      'tags_json': [
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15654,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:05:28.232851Z',
      'end_time': '2025-02-07T17:05:58.234738Z',
      'created_at': '2025-02-07 17:05:28',
      'tags_json': [
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15655,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:05:58.234738Z',
      'end_time': '2025-02-07T17:06:28.291713Z',
      'created_at': '2025-02-07 17:05:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15656,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:06:28.291713Z',
      'end_time': '2025-02-07T17:06:58.231871Z',
      'created_at': '2025-02-07 17:06:28',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15657,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:06:58.231871Z',
      'end_time': '2025-02-07T17:07:28.234206Z',
      'created_at': '2025-02-07 17:06:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15658,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:07:28.234206Z',
      'end_time': '2025-02-07T17:07:58.223209Z',
      'created_at': '2025-02-07 17:07:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15659,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:07:58.223209Z',
      'end_time': '2025-02-07T17:08:28.330941Z',
      'created_at': '2025-02-07 17:07:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15660,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:08:28.330941Z',
      'end_time': '2025-02-07T17:08:58.228094Z',
      'created_at': '2025-02-07 17:08:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15661,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:08:58.228094Z',
      'end_time': '2025-02-07T17:09:28.23189Z',
      'created_at': '2025-02-07 17:08:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15662,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:09:28.23189Z',
      'end_time': '2025-02-07T17:09:58.233101Z',
      'created_at': '2025-02-07 17:09:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15663,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:09:58.233101Z',
      'end_time': '2025-02-07T17:10:28.224837Z',
      'created_at': '2025-02-07 17:09:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15664,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:10:28.224837Z',
      'end_time': '2025-02-07T17:10:58.228764Z',
      'created_at': '2025-02-07 17:10:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15665,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:10:58.228764Z',
      'end_time': '2025-02-07T17:11:28.28167Z',
      'created_at': '2025-02-07 17:10:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15666,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:11:28.28167Z',
      'end_time': '2025-02-07T17:11:58.226839Z',
      'created_at': '2025-02-07 17:11:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15667,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:11:58.226839Z',
      'end_time': '2025-02-07T17:12:28.224985Z',
      'created_at': '2025-02-07 17:11:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15668,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:12:28.224985Z',
      'end_time': '2025-02-07T17:12:58.223362Z',
      'created_at': '2025-02-07 17:12:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15669,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:12:58.223362Z',
      'end_time': '2025-02-07T17:13:28.27585Z',
      'created_at': '2025-02-07 17:12:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15670,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:13:28.27585Z',
      'end_time': '2025-02-07T17:13:58.231252Z',
      'created_at': '2025-02-07 17:13:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15671,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:13:58.231252Z',
      'end_time': '2025-02-07T17:14:28.237712Z',
      'created_at': '2025-02-07 17:13:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15672,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:14:28.237712Z',
      'end_time': '2025-02-07T17:14:58.293282Z',
      'created_at': '2025-02-07 17:14:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15673,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:14:58.293282Z',
      'end_time': '2025-02-07T17:15:28.288102Z',
      'created_at': '2025-02-07 17:14:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15674,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:15:28.288102Z',
      'end_time': '2025-02-07T17:15:58.287903Z',
      'created_at': '2025-02-07 17:15:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15675,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:15:58.287903Z',
      'end_time': '2025-02-07T17:16:28.238049Z',
      'created_at': '2025-02-07 17:15:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15676,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:16:28.238049Z',
      'end_time': '2025-02-07T17:16:58.25097Z',
      'created_at': '2025-02-07 17:16:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15677,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:16:58.25097Z',
      'end_time': '2025-02-07T17:17:28.248359Z',
      'created_at': '2025-02-07 17:16:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15678,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:17:28.248359Z',
      'end_time': '2025-02-07T17:17:58.242133Z',
      'created_at': '2025-02-07 17:17:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15679,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:17:58.242133Z',
      'end_time': '2025-02-07T17:18:28.25468Z',
      'created_at': '2025-02-07 17:17:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15680,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:18:28.25468Z',
      'end_time': '2025-02-07T17:18:58.244413Z',
      'created_at': '2025-02-07 17:18:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15681,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:18:58.244413Z',
      'end_time': '2025-02-07T17:19:28.242189Z',
      'created_at': '2025-02-07 17:18:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15682,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:19:28.242189Z',
      'end_time': '2025-02-07T17:19:58.241213Z',
      'created_at': '2025-02-07 17:19:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15683,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:19:58.241213Z',
      'end_time': '2025-02-07T17:20:28.245541Z',
      'created_at': '2025-02-07 17:19:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15684,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:20:28.245541Z',
      'end_time': '2025-02-07T17:20:58.252361Z',
      'created_at': '2025-02-07 17:20:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15685,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:20:58.252361Z',
      'end_time': '2025-02-07T17:21:28.240058Z',
      'created_at': '2025-02-07 17:20:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15686,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:21:28.240058Z',
      'end_time': '2025-02-07T17:21:58.302932Z',
      'created_at': '2025-02-07 17:21:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15687,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:21:58.302932Z',
      'end_time': '2025-02-07T17:22:28.245024Z',
      'created_at': '2025-02-07 17:21:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15688,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:22:28.245024Z',
      'end_time': '2025-02-07T17:22:58.243127Z',
      'created_at': '2025-02-07 17:22:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15689,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:22:58.243127Z',
      'end_time': '2025-02-07T17:23:28.249606Z',
      'created_at': '2025-02-07 17:22:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15690,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:23:28.249606Z',
      'end_time': '2025-02-07T17:23:58.251484Z',
      'created_at': '2025-02-07 17:23:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15691,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:23:58.251484Z',
      'end_time': '2025-02-07T17:24:28.306411Z',
      'created_at': '2025-02-07 17:23:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15692,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:24:28.306411Z',
      'end_time': '2025-02-07T17:24:58.299856Z',
      'created_at': '2025-02-07 17:24:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15693,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:24:58.299856Z',
      'end_time': '2025-02-07T17:25:28.250861Z',
      'created_at': '2025-02-07 17:24:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15694,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:25:28.250861Z',
      'end_time': '2025-02-07T17:25:58.298554Z',
      'created_at': '2025-02-07 17:25:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15695,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:25:58.298554Z',
      'end_time': '2025-02-07T17:26:28.250503Z',
      'created_at': '2025-02-07 17:25:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15696,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:26:28.250503Z',
      'end_time': '2025-02-07T17:26:58.254286Z',
      'created_at': '2025-02-07 17:26:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15697,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:26:58.254286Z',
      'end_time': '2025-02-07T17:27:28.298205Z',
      'created_at': '2025-02-07 17:26:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15698,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:27:28.298205Z',
      'end_time': '2025-02-07T17:27:58.304459Z',
      'created_at': '2025-02-07 17:27:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15699,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:27:58.304459Z',
      'end_time': '2025-02-07T17:28:28.29634Z',
      'created_at': '2025-02-07 17:27:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15700,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:28:28.29634Z',
      'end_time': '2025-02-07T17:28:58.307909Z',
      'created_at': '2025-02-07 17:28:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15701,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:28:58.307909Z',
      'end_time': '2025-02-07T17:29:28.297181Z',
      'created_at': '2025-02-07 17:28:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15702,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:29:28.297181Z',
      'end_time': '2025-02-07T17:29:58.314095Z',
      'created_at': '2025-02-07 17:29:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15703,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:29:58.314095Z',
      'end_time': '2025-02-07T17:30:28.294901Z',
      'created_at': '2025-02-07 17:29:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15704,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:30:28.294901Z',
      'end_time': '2025-02-07T17:30:58.252473Z',
      'created_at': '2025-02-07 17:30:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15705,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:30:58.252473Z',
      'end_time': '2025-02-07T17:31:28.242662Z',
      'created_at': '2025-02-07 17:30:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15706,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:31:28.242662Z',
      'end_time': '2025-02-07T17:31:58.245522Z',
      'created_at': '2025-02-07 17:31:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15707,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:31:58.245522Z',
      'end_time': '2025-02-07T17:32:28.302287Z',
      'created_at': '2025-02-07 17:31:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15708,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:32:28.302287Z',
      'end_time': '2025-02-07T17:32:58.300865Z',
      'created_at': '2025-02-07 17:32:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15709,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:32:58.300865Z',
      'end_time': '2025-02-07T17:33:28.211789Z',
      'created_at': '2025-02-07 17:32:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15710,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:33:28.211789Z',
      'end_time': '2025-02-07T17:33:58.277683Z',
      'created_at': '2025-02-07 17:33:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15711,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T17:33:58.277683Z',
      'end_time': '2025-02-07T17:34:28.211675Z',
      'created_at': '2025-02-07 17:33:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15712,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:34:28.211675Z',
      'end_time': '2025-02-07T17:34:58.205238Z',
      'created_at': '2025-02-07 17:34:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15713,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:34:58.205238Z',
      'end_time': '2025-02-07T17:35:28.2577Z',
      'created_at': '2025-02-07 17:34:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15714,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:35:28.2577Z',
      'end_time': '2025-02-07T17:35:58.208364Z',
      'created_at': '2025-02-07 17:35:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15715,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:35:58.208364Z',
      'end_time': '2025-02-07T17:36:28.210054Z',
      'created_at': '2025-02-07 17:35:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15716,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:36:28.210054Z',
      'end_time': '2025-02-07T17:36:58.205607Z',
      'created_at': '2025-02-07 17:36:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15717,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:36:58.205607Z',
      'end_time': '2025-02-07T17:37:28.214902Z',
      'created_at': '2025-02-07 17:36:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15718,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:37:28.214902Z',
      'end_time': '2025-02-07T17:37:58.20461Z',
      'created_at': '2025-02-07 17:37:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15719,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:37:58.20461Z',
      'end_time': '2025-02-07T17:38:28.206302Z',
      'created_at': '2025-02-07 17:37:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15720,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:38:28.206302Z',
      'end_time': '2025-02-07T17:38:58.213559Z',
      'created_at': '2025-02-07 17:38:28',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15721,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:38:58.213559Z',
      'end_time': '2025-02-07T17:39:27.903375Z',
      'created_at': '2025-02-07 17:38:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15722,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:39:27.903375Z',
      'end_time': '2025-02-07T17:39:57.914033Z',
      'created_at': '2025-02-07 17:39:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15723,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:39:57.914033Z',
      'end_time': '2025-02-07T17:40:27.900866Z',
      'created_at': '2025-02-07 17:39:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15724,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:40:27.900866Z',
      'end_time': '2025-02-07T17:40:57.908048Z',
      'created_at': '2025-02-07 17:40:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15725,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:40:57.908048Z',
      'end_time': '2025-02-07T17:41:27.899368Z',
      'created_at': '2025-02-07 17:40:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15726,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:41:27.899368Z',
      'end_time': '2025-02-07T17:41:57.908622Z',
      'created_at': '2025-02-07 17:41:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15727,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:41:57.908622Z',
      'end_time': '2025-02-07T17:42:27.912237Z',
      'created_at': '2025-02-07 17:41:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15728,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:42:27.912237Z',
      'end_time': '2025-02-07T17:42:57.90712Z',
      'created_at': '2025-02-07 17:42:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15729,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:42:57.90712Z',
      'end_time': '2025-02-07T17:43:27.898893Z',
      'created_at': '2025-02-07 17:42:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15730,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:43:27.898893Z',
      'end_time': '2025-02-07T17:43:57.899956Z',
      'created_at': '2025-02-07 17:43:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15731,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:43:57.899956Z',
      'end_time': '2025-02-07T17:44:27.905727Z',
      'created_at': '2025-02-07 17:43:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15732,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:44:27.905727Z',
      'end_time': '2025-02-07T17:44:57.902972Z',
      'created_at': '2025-02-07 17:44:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15733,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:44:57.902972Z',
      'end_time': '2025-02-07T17:45:27.900965Z',
      'created_at': '2025-02-07 17:44:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15734,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:45:27.900965Z',
      'end_time': '2025-02-07T17:45:57.901317Z',
      'created_at': '2025-02-07 17:45:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15735,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:45:57.901317Z',
      'end_time': '2025-02-07T17:46:27.898925Z',
      'created_at': '2025-02-07 17:45:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15736,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:46:27.898925Z',
      'end_time': '2025-02-07T17:46:57.902687Z',
      'created_at': '2025-02-07 17:46:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15737,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:46:57.902687Z',
      'end_time': '2025-02-07T17:47:27.897137Z',
      'created_at': '2025-02-07 17:46:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15738,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:47:27.897137Z',
      'end_time': '2025-02-07T17:47:57.904355Z',
      'created_at': '2025-02-07 17:47:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15739,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:47:57.904355Z',
      'end_time': '2025-02-07T17:48:27.950703Z',
      'created_at': '2025-02-07 17:47:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15740,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:48:27.950703Z',
      'end_time': '2025-02-07T17:48:57.95483Z',
      'created_at': '2025-02-07 17:48:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15741,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:48:57.95483Z',
      'end_time': '2025-02-07T17:49:27.945308Z',
      'created_at': '2025-02-07 17:48:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15742,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:49:27.945308Z',
      'end_time': '2025-02-07T17:49:57.948826Z',
      'created_at': '2025-02-07 17:49:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15743,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:49:57.948826Z',
      'end_time': '2025-02-07T17:50:27.898782Z',
      'created_at': '2025-02-07 17:49:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15744,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:50:27.898782Z',
      'end_time': '2025-02-07T17:50:57.895251Z',
      'created_at': '2025-02-07 17:50:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15745,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:50:57.895251Z',
      'end_time': '2025-02-07T17:51:27.907041Z',
      'created_at': '2025-02-07 17:50:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15746,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:51:27.907041Z',
      'end_time': '2025-02-07T17:51:57.943775Z',
      'created_at': '2025-02-07 17:51:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15747,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:51:57.943775Z',
      'end_time': '2025-02-07T17:52:27.966392Z',
      'created_at': '2025-02-07 17:51:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15748,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:52:27.966392Z',
      'end_time': '2025-02-07T17:52:57.944122Z',
      'created_at': '2025-02-07 17:52:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15749,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:52:57.944122Z',
      'end_time': '2025-02-07T17:53:27.895562Z',
      'created_at': '2025-02-07 17:52:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15750,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:53:27.895562Z',
      'end_time': '2025-02-07T17:53:57.895571Z',
      'created_at': '2025-02-07 17:53:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15751,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:53:57.895571Z',
      'end_time': '2025-02-07T17:54:27.950871Z',
      'created_at': '2025-02-07 17:53:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15752,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:54:27.950871Z',
      'end_time': '2025-02-07T17:54:57.89838Z',
      'created_at': '2025-02-07 17:54:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15753,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:54:57.89838Z',
      'end_time': '2025-02-07T17:55:27.898257Z',
      'created_at': '2025-02-07 17:54:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15754,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:55:27.898257Z',
      'end_time': '2025-02-07T17:55:57.902147Z',
      'created_at': '2025-02-07 17:55:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15755,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:55:57.902147Z',
      'end_time': '2025-02-07T17:56:28.021845Z',
      'created_at': '2025-02-07 17:55:58',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15756,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T17:56:28.021845Z',
      'end_time': '2025-02-07T17:56:57.898691Z',
      'created_at': '2025-02-07 17:56:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15757,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:56:57.898691Z',
      'end_time': '2025-02-07T17:57:27.908738Z',
      'created_at': '2025-02-07 17:56:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15758,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:57:27.908738Z',
      'end_time': '2025-02-07T17:57:57.906708Z',
      'created_at': '2025-02-07 17:57:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15759,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:57:57.906708Z',
      'end_time': '2025-02-07T17:58:27.900763Z',
      'created_at': '2025-02-07 17:57:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15760,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T17:58:27.900763Z',
      'end_time': '2025-02-07T17:58:57.958548Z',
      'created_at': '2025-02-07 17:58:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15761,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T17:58:57.958548Z',
      'end_time': '2025-02-07T17:59:27.917856Z',
      'created_at': '2025-02-07 17:58:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15762,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T17:59:27.917856Z',
      'end_time': '2025-02-07T17:59:57.89763Z',
      'created_at': '2025-02-07 17:59:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15763,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T17:59:57.89763Z',
      'end_time': '2025-02-07T18:00:27.908839Z',
      'created_at': '2025-02-07 17:59:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15764,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:00:27.908839Z',
      'end_time': '2025-02-07T18:00:57.907545Z',
      'created_at': '2025-02-07 18:00:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15765,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:00:57.907545Z',
      'end_time': '2025-02-07T18:01:27.910361Z',
      'created_at': '2025-02-07 18:00:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15766,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:01:27.910361Z',
      'end_time': '2025-02-07T18:01:57.906407Z',
      'created_at': '2025-02-07 18:01:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15767,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:01:57.906407Z',
      'end_time': '2025-02-07T18:02:27.898099Z',
      'created_at': '2025-02-07 18:01:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15768,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T18:02:27.898099Z',
      'end_time': '2025-02-07T18:02:57.901156Z',
      'created_at': '2025-02-07 18:02:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15769,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:02:57.901156Z',
      'end_time': '2025-02-07T18:03:27.908784Z',
      'created_at': '2025-02-07 18:02:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15770,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T18:03:27.908784Z',
      'end_time': '2025-02-07T18:03:57.895161Z',
      'created_at': '2025-02-07 18:03:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15771,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:03:57.895161Z',
      'end_time': '2025-02-07T18:04:27.906721Z',
      'created_at': '2025-02-07 18:03:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15772,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:04:27.906721Z',
      'end_time': '2025-02-07T18:04:57.894456Z',
      'created_at': '2025-02-07 18:04:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15773,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:04:57.894456Z',
      'end_time': '2025-02-07T18:05:27.941667Z',
      'created_at': '2025-02-07 18:04:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15774,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:05:27.941667Z',
      'end_time': '2025-02-07T18:05:57.896416Z',
      'created_at': '2025-02-07 18:05:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15775,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:05:57.896416Z',
      'end_time': '2025-02-07T18:06:27.951126Z',
      'created_at': '2025-02-07 18:05:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15776,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:06:27.951126Z',
      'end_time': '2025-02-07T18:06:57.960073Z',
      'created_at': '2025-02-07 18:06:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15777,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:06:57.960073Z',
      'end_time': '2025-02-07T18:07:27.974671Z',
      'created_at': '2025-02-07 18:06:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15778,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:07:27.974671Z',
      'end_time': '2025-02-07T18:07:57.90303Z',
      'created_at': '2025-02-07 18:07:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15779,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:07:57.90303Z',
      'end_time': '2025-02-07T18:08:27.949713Z',
      'created_at': '2025-02-07 18:07:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15780,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:08:27.949713Z',
      'end_time': '2025-02-07T18:08:57.898289Z',
      'created_at': '2025-02-07 18:08:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15781,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:08:57.898289Z',
      'end_time': '2025-02-07T18:09:27.903009Z',
      'created_at': '2025-02-07 18:08:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15782,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:09:27.903009Z',
      'end_time': '2025-02-07T18:09:57.946362Z',
      'created_at': '2025-02-07 18:09:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15783,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:09:57.946362Z',
      'end_time': '2025-02-07T18:10:27.969155Z',
      'created_at': '2025-02-07 18:09:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15784,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:10:27.969155Z',
      'end_time': '2025-02-07T18:10:57.902005Z',
      'created_at': '2025-02-07 18:10:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15785,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:10:57.902005Z',
      'end_time': '2025-02-07T18:11:27.948918Z',
      'created_at': '2025-02-07 18:10:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15786,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:11:27.948918Z',
      'end_time': '2025-02-07T18:11:57.901238Z',
      'created_at': '2025-02-07 18:11:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15787,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:11:57.901238Z',
      'end_time': '2025-02-07T18:12:27.961774Z',
      'created_at': '2025-02-07 18:11:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15788,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:12:27.961774Z',
      'end_time': '2025-02-07T18:12:57.902547Z',
      'created_at': '2025-02-07 18:12:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15789,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:12:57.902547Z',
      'end_time': '2025-02-07T18:13:27.939988Z',
      'created_at': '2025-02-07 18:12:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15790,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:13:27.939988Z',
      'end_time': '2025-02-07T18:13:57.940445Z',
      'created_at': '2025-02-07 18:13:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15791,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T18:13:57.940445Z',
      'end_time': '2025-02-07T18:14:27.902646Z',
      'created_at': '2025-02-07 18:13:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15792,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T18:14:27.902646Z',
      'end_time': '2025-02-07T18:14:57.903811Z',
      'created_at': '2025-02-07 18:14:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15793,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:14:57.903811Z',
      'end_time': '2025-02-07T18:15:27.898157Z',
      'created_at': '2025-02-07 18:14:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15794,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:15:27.898157Z',
      'end_time': '2025-02-07T18:15:57.956189Z',
      'created_at': '2025-02-07 18:15:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15795,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:15:57.956189Z',
      'end_time': '2025-02-07T18:16:27.935137Z',
      'created_at': '2025-02-07 18:15:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15796,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:16:27.935137Z',
      'end_time': '2025-02-07T18:16:57.956858Z',
      'created_at': '2025-02-07 18:16:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15797,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:16:57.956858Z',
      'end_time': '2025-02-07T18:17:27.906959Z',
      'created_at': '2025-02-07 18:16:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15798,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:17:27.906959Z',
      'end_time': '2025-02-07T18:17:57.979729Z',
      'created_at': '2025-02-07 18:17:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15799,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T18:17:57.979729Z',
      'end_time': '2025-02-07T18:18:27.903942Z',
      'created_at': '2025-02-07 18:17:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15800,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T18:18:27.903942Z',
      'end_time': '2025-02-07T18:18:57.906246Z',
      'created_at': '2025-02-07 18:18:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15801,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:18:57.906246Z',
      'end_time': '2025-02-07T18:19:27.911481Z',
      'created_at': '2025-02-07 18:18:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15802,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:19:27.911481Z',
      'end_time': '2025-02-07T18:19:57.910037Z',
      'created_at': '2025-02-07 18:19:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15803,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:19:57.910037Z',
      'end_time': '2025-02-07T18:20:27.941292Z',
      'created_at': '2025-02-07 18:19:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15804,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T18:20:27.941292Z',
      'end_time': '2025-02-07T18:20:57.902686Z',
      'created_at': '2025-02-07 18:20:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15805,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T18:20:57.902686Z',
      'end_time': '2025-02-07T18:21:27.901359Z',
      'created_at': '2025-02-07 18:20:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15806,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:21:27.901359Z',
      'end_time': '2025-02-07T18:21:57.898953Z',
      'created_at': '2025-02-07 18:21:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15807,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:21:57.898953Z',
      'end_time': '2025-02-07T18:22:27.956528Z',
      'created_at': '2025-02-07 18:21:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15808,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:22:27.956528Z',
      'end_time': '2025-02-07T18:22:57.962312Z',
      'created_at': '2025-02-07 18:22:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15809,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T18:22:57.962312Z',
      'end_time': '2025-02-07T18:23:27.907904Z',
      'created_at': '2025-02-07 18:22:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15810,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:23:27.907904Z',
      'end_time': '2025-02-07T18:23:57.904738Z',
      'created_at': '2025-02-07 18:23:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15811,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:23:57.904738Z',
      'end_time': '2025-02-07T18:24:27.905833Z',
      'created_at': '2025-02-07 18:23:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15812,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:24:27.905833Z',
      'end_time': '2025-02-07T18:24:57.976055Z',
      'created_at': '2025-02-07 18:24:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15813,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T18:24:57.976055Z',
      'end_time': '2025-02-07T18:25:27.900753Z',
      'created_at': '2025-02-07 18:24:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15814,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:25:27.900753Z',
      'end_time': '2025-02-07T18:25:57.90598Z',
      'created_at': '2025-02-07 18:25:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15815,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:25:57.90598Z',
      'end_time': '2025-02-07T18:26:27.948477Z',
      'created_at': '2025-02-07 18:25:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15816,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:26:27.948477Z',
      'end_time': '2025-02-07T18:26:57.948124Z',
      'created_at': '2025-02-07 18:26:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15817,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:26:57.948124Z',
      'end_time': '2025-02-07T18:27:27.968326Z',
      'created_at': '2025-02-07 18:26:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15818,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T18:27:27.968326Z',
      'end_time': '2025-02-07T18:27:57.899998Z',
      'created_at': '2025-02-07 18:27:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15819,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T18:27:57.899998Z',
      'end_time': '2025-02-07T18:28:27.904474Z',
      'created_at': '2025-02-07 18:27:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15820,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:28:27.904474Z',
      'end_time': '2025-02-07T18:28:57.910027Z',
      'created_at': '2025-02-07 18:28:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15821,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:28:57.910027Z',
      'end_time': '2025-02-07T18:29:27.909475Z',
      'created_at': '2025-02-07 18:28:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15822,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:29:27.909475Z',
      'end_time': '2025-02-07T18:29:57.906379Z',
      'created_at': '2025-02-07 18:29:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15823,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T18:29:57.906379Z',
      'end_time': '2025-02-07T18:30:27.909732Z',
      'created_at': '2025-02-07 18:29:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15824,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 4,
      'start_time': '2025-02-07T18:30:27.909732Z',
      'end_time': '2025-02-07T18:30:57.906386Z',
      'created_at': '2025-02-07 18:30:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15825,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T18:30:57.906386Z',
      'end_time': '2025-02-07T18:31:27.947115Z',
      'created_at': '2025-02-07 18:30:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15826,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:31:27.947115Z',
      'end_time': '2025-02-07T18:31:57.955411Z',
      'created_at': '2025-02-07 18:31:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15827,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:31:57.955411Z',
      'end_time': '2025-02-07T18:32:27.978155Z',
      'created_at': '2025-02-07 18:31:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15828,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:32:27.978155Z',
      'end_time': '2025-02-07T18:32:57.899335Z',
      'created_at': '2025-02-07 18:32:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15829,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:32:57.899335Z',
      'end_time': '2025-02-07T18:33:27.909201Z',
      'created_at': '2025-02-07 18:32:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15830,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:33:27.909201Z',
      'end_time': '2025-02-07T18:33:57.903453Z',
      'created_at': '2025-02-07 18:33:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15831,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:33:57.903453Z',
      'end_time': '2025-02-07T18:34:27.917827Z',
      'created_at': '2025-02-07 18:33:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15832,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:34:27.917827Z',
      'end_time': '2025-02-07T18:34:57.976263Z',
      'created_at': '2025-02-07 18:34:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15833,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:34:57.976263Z',
      'end_time': '2025-02-07T18:35:27.908913Z',
      'created_at': '2025-02-07 18:34:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15834,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:35:27.908913Z',
      'end_time': '2025-02-07T18:35:57.913653Z',
      'created_at': '2025-02-07 18:35:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15835,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:35:57.913653Z',
      'end_time': '2025-02-07T18:36:27.911004Z',
      'created_at': '2025-02-07 18:35:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15836,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:36:27.911004Z',
      'end_time': '2025-02-07T18:36:57.913239Z',
      'created_at': '2025-02-07 18:36:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15837,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:36:57.913239Z',
      'end_time': '2025-02-07T18:37:27.96923Z',
      'created_at': '2025-02-07 18:36:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15838,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:37:27.96923Z',
      'end_time': '2025-02-07T18:37:57.910747Z',
      'created_at': '2025-02-07 18:37:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15839,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:37:57.910747Z',
      'end_time': '2025-02-07T18:38:27.910501Z',
      'created_at': '2025-02-07 18:37:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15840,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:38:27.910501Z',
      'end_time': '2025-02-07T18:38:57.91562Z',
      'created_at': '2025-02-07 18:38:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15841,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:38:57.91562Z',
      'end_time': '2025-02-07T18:39:27.911691Z',
      'created_at': '2025-02-07 18:38:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15842,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:39:27.911691Z',
      'end_time': '2025-02-07T18:39:57.913585Z',
      'created_at': '2025-02-07 18:39:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15843,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:39:57.913585Z',
      'end_time': '2025-02-07T18:40:27.968892Z',
      'created_at': '2025-02-07 18:39:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15844,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:40:27.968892Z',
      'end_time': '2025-02-07T18:40:57.911405Z',
      'created_at': '2025-02-07 18:40:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15845,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:40:57.911405Z',
      'end_time': '2025-02-07T18:41:27.954267Z',
      'created_at': '2025-02-07 18:40:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15846,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:41:27.954267Z',
      'end_time': '2025-02-07T18:41:57.916628Z',
      'created_at': '2025-02-07 18:41:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15847,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:41:57.916628Z',
      'end_time': '2025-02-07T18:42:27.908671Z',
      'created_at': '2025-02-07 18:41:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15848,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:42:27.908671Z',
      'end_time': '2025-02-07T18:42:57.916799Z',
      'created_at': '2025-02-07 18:42:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15849,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:42:57.916799Z',
      'end_time': '2025-02-07T18:43:27.950085Z',
      'created_at': '2025-02-07 18:42:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15850,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T18:43:27.950085Z',
      'end_time': '2025-02-07T18:43:57.911189Z',
      'created_at': '2025-02-07 18:43:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15851,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T18:43:57.911189Z',
      'end_time': '2025-02-07T18:44:27.913058Z',
      'created_at': '2025-02-07 18:43:57',
      'tags_json': [
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15852,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:44:27.913058Z',
      'end_time': '2025-02-07T18:44:57.962213Z',
      'created_at': '2025-02-07 18:44:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15853,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:44:57.962213Z',
      'end_time': '2025-02-07T18:45:27.964905Z',
      'created_at': '2025-02-07 18:44:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15854,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:45:27.964905Z',
      'end_time': '2025-02-07T18:45:57.962589Z',
      'created_at': '2025-02-07 18:45:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15855,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:45:57.962589Z',
      'end_time': '2025-02-07T18:46:27.967618Z',
      'created_at': '2025-02-07 18:45:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15856,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:46:27.967618Z',
      'end_time': '2025-02-07T18:46:57.974893Z',
      'created_at': '2025-02-07 18:46:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15857,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:46:57.974893Z',
      'end_time': '2025-02-07T18:47:27.948217Z',
      'created_at': '2025-02-07 18:46:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15858,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:47:27.948217Z',
      'end_time': '2025-02-07T18:47:58.004049Z',
      'created_at': '2025-02-07 18:47:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15859,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:47:58.004049Z',
      'end_time': '2025-02-07T18:48:27.958781Z',
      'created_at': '2025-02-07 18:47:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15860,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:48:27.958781Z',
      'end_time': '2025-02-07T18:48:57.94702Z',
      'created_at': '2025-02-07 18:48:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15861,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:48:57.94702Z',
      'end_time': '2025-02-07T18:49:27.962004Z',
      'created_at': '2025-02-07 18:48:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15862,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:49:27.962004Z',
      'end_time': '2025-02-07T18:49:57.956759Z',
      'created_at': '2025-02-07 18:49:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15863,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:49:57.956759Z',
      'end_time': '2025-02-07T18:50:27.967221Z',
      'created_at': '2025-02-07 18:49:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15864,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:50:27.967221Z',
      'end_time': '2025-02-07T18:50:58.00382Z',
      'created_at': '2025-02-07 18:50:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15865,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:50:58.00382Z',
      'end_time': '2025-02-07T18:51:27.962412Z',
      'created_at': '2025-02-07 18:50:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15866,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:51:27.962412Z',
      'end_time': '2025-02-07T18:51:57.956385Z',
      'created_at': '2025-02-07 18:51:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15867,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:51:57.956385Z',
      'end_time': '2025-02-07T18:52:27.954365Z',
      'created_at': '2025-02-07 18:51:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15868,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:52:27.954365Z',
      'end_time': '2025-02-07T18:52:57.97383Z',
      'created_at': '2025-02-07 18:52:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15869,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:52:57.97383Z',
      'end_time': '2025-02-07T18:53:27.969235Z',
      'created_at': '2025-02-07 18:52:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15870,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:53:27.969235Z',
      'end_time': '2025-02-07T18:53:57.968914Z',
      'created_at': '2025-02-07 18:53:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15871,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T18:53:57.968914Z',
      'end_time': '2025-02-07T18:54:28.001283Z',
      'created_at': '2025-02-07 18:53:58',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15872,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:54:28.001283Z',
      'end_time': '2025-02-07T18:54:57.975855Z',
      'created_at': '2025-02-07 18:54:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15873,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:54:57.975855Z',
      'end_time': '2025-02-07T18:55:27.982884Z',
      'created_at': '2025-02-07 18:54:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15874,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:55:27.982884Z',
      'end_time': '2025-02-07T18:55:57.997753Z',
      'created_at': '2025-02-07 18:55:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15875,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:55:57.997753Z',
      'end_time': '2025-02-07T18:56:27.990634Z',
      'created_at': '2025-02-07 18:55:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15876,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:56:27.990634Z',
      'end_time': '2025-02-07T18:56:57.996736Z',
      'created_at': '2025-02-07 18:56:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15877,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:56:57.996736Z',
      'end_time': '2025-02-07T18:57:27.990414Z',
      'created_at': '2025-02-07 18:56:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15878,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:57:27.990414Z',
      'end_time': '2025-02-07T18:57:57.988969Z',
      'created_at': '2025-02-07 18:57:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15879,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:57:57.988969Z',
      'end_time': '2025-02-07T18:58:27.986879Z',
      'created_at': '2025-02-07 18:57:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15880,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:58:27.986879Z',
      'end_time': '2025-02-07T18:58:57.990639Z',
      'created_at': '2025-02-07 18:58:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15881,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:58:57.990639Z',
      'end_time': '2025-02-07T18:59:28.021148Z',
      'created_at': '2025-02-07 18:58:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15882,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:59:28.021148Z',
      'end_time': '2025-02-07T18:59:58.001758Z',
      'created_at': '2025-02-07 18:59:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15883,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T18:59:58.001758Z',
      'end_time': '2025-02-07T19:00:27.993579Z',
      'created_at': '2025-02-07 18:59:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15884,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:00:27.993579Z',
      'end_time': '2025-02-07T19:00:57.996109Z',
      'created_at': '2025-02-07 19:00:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15885,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:00:57.996109Z',
      'end_time': '2025-02-07T19:01:27.991212Z',
      'created_at': '2025-02-07 19:00:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15886,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:01:27.991212Z',
      'end_time': '2025-02-07T19:01:57.987494Z',
      'created_at': '2025-02-07 19:01:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15887,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:01:57.987494Z',
      'end_time': '2025-02-07T19:02:27.993491Z',
      'created_at': '2025-02-07 19:01:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15888,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:02:27.993491Z',
      'end_time': '2025-02-07T19:02:57.980049Z',
      'created_at': '2025-02-07 19:02:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15889,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:02:57.980049Z',
      'end_time': '2025-02-07T19:03:27.995292Z',
      'created_at': '2025-02-07 19:02:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15890,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:03:27.995292Z',
      'end_time': '2025-02-07T19:03:57.977665Z',
      'created_at': '2025-02-07 19:03:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15891,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:03:57.977665Z',
      'end_time': '2025-02-07T19:04:28.000064Z',
      'created_at': '2025-02-07 19:03:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15892,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:04:28.000064Z',
      'end_time': '2025-02-07T19:04:58.001433Z',
      'created_at': '2025-02-07 19:04:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15893,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:04:58.001433Z',
      'end_time': '2025-02-07T19:05:27.997841Z',
      'created_at': '2025-02-07 19:04:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15894,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:05:27.997841Z',
      'end_time': '2025-02-07T19:05:57.989977Z',
      'created_at': '2025-02-07 19:05:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15895,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:05:57.989977Z',
      'end_time': '2025-02-07T19:06:28.000981Z',
      'created_at': '2025-02-07 19:05:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15896,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:06:28.000981Z',
      'end_time': '2025-02-07T19:06:57.995131Z',
      'created_at': '2025-02-07 19:06:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15897,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:06:57.995131Z',
      'end_time': '2025-02-07T19:07:27.99421Z',
      'created_at': '2025-02-07 19:06:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15898,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:07:27.99421Z',
      'end_time': '2025-02-07T19:07:57.991093Z',
      'created_at': '2025-02-07 19:07:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15899,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:07:57.991093Z',
      'end_time': '2025-02-07T19:08:28.00056Z',
      'created_at': '2025-02-07 19:07:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15900,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:08:28.00056Z',
      'end_time': '2025-02-07T19:08:57.995694Z',
      'created_at': '2025-02-07 19:08:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15901,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:08:57.995694Z',
      'end_time': '2025-02-07T19:09:28.00483Z',
      'created_at': '2025-02-07 19:08:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15902,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:09:28.00483Z',
      'end_time': '2025-02-07T19:09:57.99652Z',
      'created_at': '2025-02-07 19:09:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15903,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:09:57.99652Z',
      'end_time': '2025-02-07T19:10:28.008741Z',
      'created_at': '2025-02-07 19:09:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15904,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:10:28.008741Z',
      'end_time': '2025-02-07T19:10:57.996786Z',
      'created_at': '2025-02-07 19:10:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15905,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:10:57.996786Z',
      'end_time': '2025-02-07T19:11:28.001914Z',
      'created_at': '2025-02-07 19:10:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15906,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:11:28.001914Z',
      'end_time': '2025-02-07T19:11:57.989463Z',
      'created_at': '2025-02-07 19:11:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15907,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:11:57.989463Z',
      'end_time': '2025-02-07T19:12:28.003977Z',
      'created_at': '2025-02-07 19:11:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15908,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:12:28.003977Z',
      'end_time': '2025-02-07T19:12:58.000123Z',
      'created_at': '2025-02-07 19:12:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15909,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:12:58.000123Z',
      'end_time': '2025-02-07T19:13:28.002201Z',
      'created_at': '2025-02-07 19:12:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15910,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:13:28.002201Z',
      'end_time': '2025-02-07T19:13:57.998008Z',
      'created_at': '2025-02-07 19:13:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15911,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:13:57.998008Z',
      'end_time': '2025-02-07T19:14:27.994876Z',
      'created_at': '2025-02-07 19:13:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15912,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:14:27.994876Z',
      'end_time': '2025-02-07T19:14:58.002224Z',
      'created_at': '2025-02-07 19:14:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15913,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:14:58.002224Z',
      'end_time': '2025-02-07T19:15:28.053589Z',
      'created_at': '2025-02-07 19:14:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15914,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:15:28.053589Z',
      'end_time': '2025-02-07T19:15:57.994313Z',
      'created_at': '2025-02-07 19:15:27',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15915,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:15:57.994313Z',
      'end_time': '2025-02-07T19:16:28.139349Z',
      'created_at': '2025-02-07 19:15:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15916,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:16:28.139349Z',
      'end_time': '2025-02-07T19:16:58.003857Z',
      'created_at': '2025-02-07 19:16:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15917,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:16:58.003857Z',
      'end_time': '2025-02-07T19:17:28.013415Z',
      'created_at': '2025-02-07 19:16:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15918,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:17:28.013415Z',
      'end_time': '2025-02-07T19:17:58.008169Z',
      'created_at': '2025-02-07 19:17:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15919,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:17:58.008169Z',
      'end_time': '2025-02-07T19:18:28.01986Z',
      'created_at': '2025-02-07 19:17:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15920,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:18:28.01986Z',
      'end_time': '2025-02-07T19:18:58.015594Z',
      'created_at': '2025-02-07 19:18:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15921,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:18:58.015594Z',
      'end_time': '2025-02-07T19:19:27.984586Z',
      'created_at': '2025-02-07 19:18:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15922,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:19:27.984586Z',
      'end_time': '2025-02-07T19:19:58.004634Z',
      'created_at': '2025-02-07 19:19:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15923,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:19:58.004634Z',
      'end_time': '2025-02-07T19:20:28.01077Z',
      'created_at': '2025-02-07 19:19:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15924,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:20:28.01077Z',
      'end_time': '2025-02-07T19:20:58.003269Z',
      'created_at': '2025-02-07 19:20:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15925,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:20:58.003269Z',
      'end_time': '2025-02-07T19:21:28.013779Z',
      'created_at': '2025-02-07 19:20:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15926,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:21:28.013779Z',
      'end_time': '2025-02-07T19:21:58.011926Z',
      'created_at': '2025-02-07 19:21:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15927,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:21:58.011926Z',
      'end_time': '2025-02-07T19:22:28.010014Z',
      'created_at': '2025-02-07 19:21:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15928,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:22:28.010014Z',
      'end_time': '2025-02-07T19:22:58.003797Z',
      'created_at': '2025-02-07 19:22:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15929,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:22:58.003797Z',
      'end_time': '2025-02-07T19:23:28.023288Z',
      'created_at': '2025-02-07 19:22:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15930,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:23:28.023288Z',
      'end_time': '2025-02-07T19:23:58.020849Z',
      'created_at': '2025-02-07 19:23:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15931,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:23:58.020849Z',
      'end_time': '2025-02-07T19:24:28.00198Z',
      'created_at': '2025-02-07 19:23:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15932,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:24:28.00198Z',
      'end_time': '2025-02-07T19:24:58.003709Z',
      'created_at': '2025-02-07 19:24:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15933,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:24:58.003709Z',
      'end_time': '2025-02-07T19:25:28.01071Z',
      'created_at': '2025-02-07 19:24:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15934,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:25:28.01071Z',
      'end_time': '2025-02-07T19:25:58.008652Z',
      'created_at': '2025-02-07 19:25:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15935,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:25:58.008652Z',
      'end_time': '2025-02-07T19:26:28.014347Z',
      'created_at': '2025-02-07 19:25:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15936,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:26:28.014347Z',
      'end_time': '2025-02-07T19:26:58.01047Z',
      'created_at': '2025-02-07 19:26:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15937,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:26:58.01047Z',
      'end_time': '2025-02-07T19:27:29.234745Z',
      'created_at': '2025-02-07 19:27:07',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15938,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:27:29.234745Z',
      'end_time': '2025-02-07T19:27:58.058214Z',
      'created_at': '2025-02-07 19:27:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15939,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:27:58.058214Z',
      'end_time': '2025-02-07T19:28:28.039976Z',
      'created_at': '2025-02-07 19:27:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15940,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:28:28.039976Z',
      'end_time': '2025-02-07T19:28:58.034396Z',
      'created_at': '2025-02-07 19:28:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15941,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:28:58.034396Z',
      'end_time': '2025-02-07T19:29:28.026883Z',
      'created_at': '2025-02-07 19:28:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15942,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:29:28.026883Z',
      'end_time': '2025-02-07T19:29:58.022445Z',
      'created_at': '2025-02-07 19:29:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15943,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:29:58.022445Z',
      'end_time': '2025-02-07T19:30:28.018298Z',
      'created_at': '2025-02-07 19:29:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15944,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:30:28.018298Z',
      'end_time': '2025-02-07T19:30:58.025325Z',
      'created_at': '2025-02-07 19:30:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15945,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:30:58.025325Z',
      'end_time': '2025-02-07T19:31:28.029272Z',
      'created_at': '2025-02-07 19:30:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15946,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:31:28.029272Z',
      'end_time': '2025-02-07T19:31:58.018837Z',
      'created_at': '2025-02-07 19:31:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15947,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:31:58.018837Z',
      'end_time': '2025-02-07T19:32:28.018971Z',
      'created_at': '2025-02-07 19:31:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15948,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:32:28.018971Z',
      'end_time': '2025-02-07T19:32:57.971196Z',
      'created_at': '2025-02-07 19:32:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15949,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:32:57.971196Z',
      'end_time': '2025-02-07T19:33:27.972363Z',
      'created_at': '2025-02-07 19:32:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15950,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:33:27.972363Z',
      'end_time': '2025-02-07T19:33:57.96379Z',
      'created_at': '2025-02-07 19:33:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15951,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:33:57.96379Z',
      'end_time': '2025-02-07T19:34:27.970417Z',
      'created_at': '2025-02-07 19:33:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15952,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 4,
      'start_time': '2025-02-07T19:34:27.970417Z',
      'end_time': '2025-02-07T19:34:57.973662Z',
      'created_at': '2025-02-07 19:34:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15953,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:34:57.973662Z',
      'end_time': '2025-02-07T19:35:28.027252Z',
      'created_at': '2025-02-07 19:34:58',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15954,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:35:28.027252Z',
      'end_time': '2025-02-07T19:35:57.967007Z',
      'created_at': '2025-02-07 19:35:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    },
    {
      'id': 15955,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T19:35:57.967007Z',
      'end_time': '2025-02-07T19:36:28.034054Z',
      'created_at': '2025-02-07 19:35:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15956,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:36:28.034054Z',
      'end_time': '2025-02-07T19:36:57.969649Z',
      'created_at': '2025-02-07 19:36:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15957,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:36:57.969649Z',
      'end_time': '2025-02-07T19:37:28.032379Z',
      'created_at': '2025-02-07 19:36:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15958,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 3,
      'start_time': '2025-02-07T19:37:28.032379Z',
      'end_time': '2025-02-07T19:37:57.965758Z',
      'created_at': '2025-02-07 19:37:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15959,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:37:57.965758Z',
      'end_time': '2025-02-07T19:38:27.963864Z',
      'created_at': '2025-02-07 19:37:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15960,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 6,
      'start_time': '2025-02-07T19:38:27.963864Z',
      'end_time': '2025-02-07T19:38:57.969869Z',
      'created_at': '2025-02-07 19:38:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15961,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:38:57.969869Z',
      'end_time': '2025-02-07T19:39:27.965132Z',
      'created_at': '2025-02-07 19:38:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15962,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:39:27.965132Z',
      'end_time': '2025-02-07T19:39:58.146945Z',
      'created_at': '2025-02-07 19:39:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15963,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:39:58.146945Z',
      'end_time': '2025-02-07T19:40:27.962947Z',
      'created_at': '2025-02-07 19:39:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15964,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:40:27.962947Z',
      'end_time': '2025-02-07T19:40:57.974571Z',
      'created_at': '2025-02-07 19:40:27',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15965,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:40:57.974571Z',
      'end_time': '2025-02-07T19:41:27.972671Z',
      'created_at': '2025-02-07 19:40:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15966,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:41:27.972671Z',
      'end_time': '2025-02-07T19:41:57.973107Z',
      'created_at': '2025-02-07 19:41:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15967,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:41:57.973107Z',
      'end_time': '2025-02-07T19:42:27.964791Z',
      'created_at': '2025-02-07 19:41:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15968,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:42:27.964791Z',
      'end_time': '2025-02-07T19:42:57.966219Z',
      'created_at': '2025-02-07 19:42:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15969,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:42:57.966219Z',
      'end_time': '2025-02-07T19:43:27.963327Z',
      'created_at': '2025-02-07 19:42:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15970,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 7,
      'start_time': '2025-02-07T19:43:27.963327Z',
      'end_time': '2025-02-07T19:43:57.988624Z',
      'created_at': '2025-02-07 19:43:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15971,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:43:57.988624Z',
      'end_time': '2025-02-07T19:44:27.974628Z',
      'created_at': '2025-02-07 19:43:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15972,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:44:27.974628Z',
      'end_time': '2025-02-07T19:44:57.967396Z',
      'created_at': '2025-02-07 19:44:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15973,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 1,
      'start_time': '2025-02-07T19:44:57.967396Z',
      'end_time': '2025-02-07T19:45:27.965366Z',
      'created_at': '2025-02-07 19:44:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15974,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 4,
      'start_time': '2025-02-07T19:45:27.965366Z',
      'end_time': '2025-02-07T19:45:57.972118Z',
      'created_at': '2025-02-07 19:45:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15975,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:45:57.972118Z',
      'end_time': '2025-02-07T19:46:27.966965Z',
      'created_at': '2025-02-07 19:45:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15976,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:46:27.966965Z',
      'end_time': '2025-02-07T19:46:57.965666Z',
      'created_at': '2025-02-07 19:46:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15977,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 4,
      'start_time': '2025-02-07T19:46:57.965666Z',
      'end_time': '2025-02-07T19:47:27.977351Z',
      'created_at': '2025-02-07 19:46:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15978,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:47:27.977351Z',
      'end_time': '2025-02-07T19:47:57.976946Z',
      'created_at': '2025-02-07 19:47:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15979,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:47:57.976946Z',
      'end_time': '2025-02-07T19:48:28.017987Z',
      'created_at': '2025-02-07 19:47:58',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15980,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:48:28.017987Z',
      'end_time': '2025-02-07T19:48:58.024636Z',
      'created_at': '2025-02-07 19:48:28',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15981,
      'state': 'INACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:48:58.024636Z',
      'end_time': '2025-02-07T19:49:27.982016Z',
      'created_at': '2025-02-07 19:48:57',
      'tags_json': [
        {
          'tag_id': '5e59476d-16c6-4a59-94ff-94c0de67ed88',
          'name': 'idle'
        }
      ]
    },
    {
      'id': 15982,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:49:27.982016Z',
      'end_time': '2025-02-07T19:49:58.053981Z',
      'created_at': '2025-02-07 19:49:28',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15983,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:49:58.053981Z',
      'end_time': '2025-02-07T19:50:28.064299Z',
      'created_at': '2025-02-07 19:49:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15984,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:50:28.064299Z',
      'end_time': '2025-02-07T19:50:57.970469Z',
      'created_at': '2025-02-07 19:50:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15985,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:50:57.970469Z',
      'end_time': '2025-02-07T19:51:28.032218Z',
      'created_at': '2025-02-07 19:50:58',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15986,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 2,
      'start_time': '2025-02-07T19:51:28.032218Z',
      'end_time': '2025-02-07T19:51:57.973904Z',
      'created_at': '2025-02-07 19:51:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15987,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:51:57.973904Z',
      'end_time': '2025-02-07T19:52:27.972284Z',
      'created_at': '2025-02-07 19:51:57',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        }
      ]
    },
    {
      'id': 15988,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 4,
      'start_time': '2025-02-07T19:52:27.972284Z',
      'end_time': '2025-02-07T19:52:57.971633Z',
      'created_at': '2025-02-07 19:52:27',
      'tags_json': [
        {
          'tag_id': '5ba10e13-d342-4262-a391-9b9aa95332cd',
          'name': 'creating'
        },
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        }
      ]
    },
    {
      'id': 15989,
      'state': 'ACTIVE' as ActivityStateType,
      'app_switches': 0,
      'start_time': '2025-02-07T19:52:57.971633Z',
      'end_time': '2025-02-07T19:53:27.982146Z',
      'created_at': '2025-02-07 19:52:57',
      'tags_json': [
        {
          'tag_id': '80b3e0a5-0477-4f35-b250-2ee1b0de75d3',
          'name': 'consuming'
        },
        {
          'tag_id': 'fa9da06f-266d-49bf-86b4-ea31f006c24c',
          'name': 'neutral'
        }
      ]
    }
  ]
}
