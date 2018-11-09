import * as opentracing from 'opentracing'
import Configuration from './configuration'
import ConfigurationEnv from './configuration_env'

import SpanContext from './span_context'
import Span from './span'
import Tracer from './tracer'

import ConstSampler from './samplers/const_sampler'
import ProbabilisticSampler from './samplers/probabilistic_sampler'
import RateLimitingSampler from './samplers/ratelimiting_sampler'
import RemoteSampler from './samplers/remote_sampler'

import CompositeReporter from './reporters/composite_reporter'
import InMemoryReporter from './reporters/in_memory_reporter'
import LoggingReporter from './reporters/logging_reporter'
import NoopReporter from './reporters/noop_reporter'
import RemoteReporter from './reporters/remote_reporter'

import TextMapCodec from './propagators/text_map_codec'
import ZipkinB3TextMapCodec from './propagators/zipkin_b3_text_map_codec'

import TestUtils from './test_util'
import TChannelBridge from './tchannel_bridge'

import PrometheusMetricsFactory from './metrics/prometheus'

export default {
  Configuration,
  initTracer: Configuration.initTracer,
  initTracerFromEnv: ConfigurationEnv.initTracer,
  SpanContext,
  Span,
  Tracer,

  ConstSampler,
  ProbabilisticSampler,
  RateLimitingSampler,
  RemoteSampler,

  CompositeReporter,
  InMemoryReporter,
  LoggingReporter,
  NoopReporter,
  RemoteReporter,

  TextMapCodec,
  ZipkinB3TextMapCodec,

  TestUtils,
  TChannelBridge,
  PrometheusMetricsFactory,
  opentracing,
}