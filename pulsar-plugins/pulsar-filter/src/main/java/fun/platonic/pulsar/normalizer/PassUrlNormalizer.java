/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package fun.platonic.pulsar.normalizer;

import fun.platonic.pulsar.common.config.ImmutableConfig;
import fun.platonic.pulsar.crawl.filter.UrlNormalizer;

/**
 * This UrlNormalizer doesn't change urls. It is sometimes useful if for a given
 * scope at least one normalizer must be defined but no transformations are
 * required.
 *
 * @author Andrzej Bialecki
 */
public class PassUrlNormalizer implements UrlNormalizer {

    public PassUrlNormalizer(ImmutableConfig conf) {

    }

    public String normalize(String urlString, String scope) {
        return urlString;
    }
}