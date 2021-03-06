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

package ai.platon.pulsar.crawl.protocol;

import ai.platon.pulsar.common.config.Configurable;
import ai.platon.pulsar.common.config.MutableConfig;
import ai.platon.pulsar.common.config.VolatileConfig;
import ai.platon.pulsar.persist.WebPage;
import crawlercommons.robots.BaseRobotRules;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.Collections;

/**
 * A retriever of url content. Implemented by protocol extensions.
 *
 * TODO: protocols are designed to be initialized at setConf() method, which is not good
 */
public interface Protocol extends Configurable, AutoCloseable {

    Logger LOG = LoggerFactory.getLogger(Protocol.class);

    default boolean supportParallel() {
        return false;
    }

    default void setResponse(Response response) {
    }

    default Collection<Response> getResponses(Collection<WebPage> pages, VolatileConfig volatileConfig) {
        return Collections.emptyList();
    }

    /*
     * Returns the {@link Content} for a fetchlist entry.
     */
    ProtocolOutput getProtocolOutput(WebPage page);

    /**
     * Retrieve robot rules applicable for this url.
     *
     * @param page
     * @return robot rules (specific for this url or default), never null
     */
    BaseRobotRules getRobotRules(WebPage page);

    @Override
    default void close() {
    }
}
