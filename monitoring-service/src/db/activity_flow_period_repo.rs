use super::models::ActivityFlowPeriod;

#[derive(Clone)]
pub struct ActivityFlowPeriodRepo {
    pool: sqlx::SqlitePool,
}

impl ActivityFlowPeriodRepo {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        ActivityFlowPeriodRepo { pool }
    }

    pub async fn save_activity_flow_period(
        &self,
        activity_flow_period: &ActivityFlowPeriod,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;

        sqlx::query!(
            r#"INSERT INTO activity_flow_period (start_time, end_time, score, app_switches, inactive_time, created_at)
          VALUES (?, ?, ?, ?, ?, ?)"#,
            activity_flow_period.start_time,
            activity_flow_period.end_time,
            activity_flow_period.score,
            activity_flow_period.app_switches,
            activity_flow_period.inactive_time,
            activity_flow_period.created_at,
        )
        .execute(&mut *conn)
        .await
    }

    pub async fn get_last_activity_flow_period(&self) -> Result<ActivityFlowPeriod, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(
            ActivityFlowPeriod,
            "SELECT * FROM activity_flow_period ORDER BY id DESC LIMIT 1"
        )
        .fetch_one(&mut *conn)
        .await
    }
    // pub async fn get_activity_flow_period(
    //     &self,
    //     id: i32,
    // ) -> Result<ActivityFlowPeriod, sqlx::Error> {
    //     let mut conn = self.pool.acquire().await?;
    //     sqlx::query_as!(
    //         ActivityFlowPeriod,
    //         "SELECT * FROM activity_flow_period WHERE id = ?",
    //         id
    //     )
    // }
}

#[cfg(test)]
mod tests {
    use time::OffsetDateTime;

    use crate::db::db_manager;

    use super::*;

    #[tokio::test]
    async fn test_get_last_activity_flow_period() {
        let pool = db_manager::create_test_db().await;
        let repo = ActivityFlowPeriodRepo::new(pool);
        // save a test activity flow period
        let activity_flow_period = ActivityFlowPeriod {
            id: None,
            start_time: OffsetDateTime::now_utc(),
            end_time: OffsetDateTime::now_utc(),
            score: 1.0,
            app_switches: 0,
            inactive_time: 0,
            created_at: OffsetDateTime::now_utc(),
        };
        repo.save_activity_flow_period(&activity_flow_period).await;
        let activity_flow_period = ActivityFlowPeriod {
            id: None,
            start_time: OffsetDateTime::now_utc(),
            end_time: OffsetDateTime::now_utc(),
            score: 2.0,
            app_switches: 0,
            inactive_time: 0,
            created_at: OffsetDateTime::now_utc(),
        };
        repo.save_activity_flow_period(&activity_flow_period).await;

        let activity_flow_period = repo
            .get_last_activity_flow_period()
            .await
            .expect("Failed to get last activity flow period");
        assert_eq!(activity_flow_period.score, 2.0);
    }
}
