--
-- PostgreSQL database dump
--

\restrict 8AxcFbFkkIdSSexOXKiFYI4P3OaZSPepWyYe4NJtytT6dBewNAUSUMI5nphKnEr

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-03-05 12:49:09

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16490)
-- Name: policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policies (
    id integer NOT NULL,
    title character varying NOT NULL,
    description character varying,
    premium double precision CONSTRAINT policies_premium_amount_not_null NOT NULL,
    provider_id integer,
    policy_type character varying,
    coverage jsonb DEFAULT '{}'::jsonb,
    tnc_url character varying,
    deductible numeric DEFAULT 0,
    term_months integer DEFAULT 12,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.policies OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16489)
-- Name: policies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.policies_id_seq OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 223
-- Name: policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.policies_id_seq OWNED BY public.policies.id;


--
-- TOC entry 222 (class 1259 OID 16478)
-- Name: providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.providers (
    id integer NOT NULL,
    name character varying NOT NULL,
    contact_email character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    country character varying
);


ALTER TABLE public.providers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16477)
-- Name: providers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.providers_id_seq OWNER TO postgres;

--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 221
-- Name: providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;


--
-- TOC entry 226 (class 1259 OID 16508)
-- Name: user_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_policies (
    id integer NOT NULL,
    user_id integer,
    policy_id integer,
    policy_number character varying,
    start_date date,
    end_date date,
    status character varying,
    auto_renew boolean
);


ALTER TABLE public.user_policies OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16507)
-- Name: user_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_policies_id_seq OWNER TO postgres;

--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 225
-- Name: user_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_policies_id_seq OWNED BY public.user_policies.id;


--
-- TOC entry 220 (class 1259 OID 16463)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    dob date,
    risk_profile jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16462)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4876 (class 2604 OID 16493)
-- Name: policies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies ALTER COLUMN id SET DEFAULT nextval('public.policies_id_seq'::regclass);


--
-- TOC entry 4874 (class 2604 OID 16481)
-- Name: providers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);


--
-- TOC entry 4881 (class 2604 OID 16511)
-- Name: user_policies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_policies ALTER COLUMN id SET DEFAULT nextval('public.user_policies_id_seq'::regclass);


--
-- TOC entry 4871 (class 2604 OID 16466)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4891 (class 2606 OID 16500)
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- TOC entry 4888 (class 2606 OID 16487)
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 16516)
-- Name: user_policies user_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_policies
    ADD CONSTRAINT user_policies_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 16518)
-- Name: user_policies user_policies_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_policies
    ADD CONSTRAINT user_policies_policy_number_key UNIQUE (policy_number);


--
-- TOC entry 4885 (class 2606 OID 16474)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 1259 OID 16506)
-- Name: ix_policies_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_policies_id ON public.policies USING btree (id);


--
-- TOC entry 4886 (class 1259 OID 16488)
-- Name: ix_providers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_providers_id ON public.providers USING btree (id);


--
-- TOC entry 4892 (class 1259 OID 16529)
-- Name: ix_user_policies_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_policies_id ON public.user_policies USING btree (id);


--
-- TOC entry 4882 (class 1259 OID 16475)
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- TOC entry 4883 (class 1259 OID 16476)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 4897 (class 2606 OID 16501)
-- Name: policies policies_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 4898 (class 2606 OID 16524)
-- Name: user_policies user_policies_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_policies
    ADD CONSTRAINT user_policies_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id);


--
-- TOC entry 4899 (class 2606 OID 16519)
-- Name: user_policies user_policies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_policies
    ADD CONSTRAINT user_policies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2026-03-05 12:49:09

--
-- PostgreSQL database dump complete
--

\unrestrict 8AxcFbFkkIdSSexOXKiFYI4P3OaZSPepWyYe4NJtytT6dBewNAUSUMI5nphKnEr

