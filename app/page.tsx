import Image from "next/image";

import HomeRedirect from "../_components/HomeRedirect";
import { ButtonLink } from "../_components/ui/Button";
import "./home.css";

export default function Home() {
  return (
    <main className="home">
      <HomeRedirect />
      <div className="home__card">
        <Image
          src="/mirai-logo.png"
          alt="Mirai"
          width={226}
          height={103}
          priority
          className="home__logo"
        />
        <h1 className="home__title">Welcome to Mirai</h1>
        <p className="home__text">
          Mirai helps teachers and parents notice early signs that a child may
          need extra support. It is a screening tool. It never gives a
          diagnosis.
        </p>
        <div className="home__actions">
          <ButtonLink href="/teacher/login" block>
            I am a teacher
          </ButtonLink>
          <ButtonLink href="/parent/login" variant="outline" block>
            I am a parent
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
