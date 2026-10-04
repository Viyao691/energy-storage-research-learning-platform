from locust import HttpUser, between, task


class ResearchCopilotUser(HttpUser):
    wait_time = between(0.2, 1.0)

    @task(4)
    def live(self):
        with self.client.get("/health/live", name="/health/live", catch_response=True) as response:
            if response.elapsed.total_seconds() > 0.25:
                response.failure("live endpoint exceeded 250ms")

    @task(2)
    def ready(self):
        with self.client.get("/health/ready", name="/health/ready", catch_response=True) as response:
            if response.elapsed.total_seconds() > 0.5:
                response.failure("ready endpoint exceeded 500ms")

    @task(1)
    def contests(self):
        with self.client.get("/api/v1/contests", name="/api/v1/contests", catch_response=True) as response:
            if response.elapsed.total_seconds() > 1.0:
                response.failure("contest list exceeded 1s")
