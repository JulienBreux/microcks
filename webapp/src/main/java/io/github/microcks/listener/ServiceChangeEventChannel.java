/*
 * Copyright The Microcks Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.github.microcks.listener;

import io.github.microcks.event.ServiceViewChangeEvent;

/**
 * This represents a communication via the one me may publish events that relates
 * services changes.
 * @author laurent
 */
public interface ServiceChangeEventChannel {

   /**
    * Send a change event on a Service complete view.
    * @param event The event to send or propagate via this channel.
    * @throws Exception if the case event cannot be sent
    */
   void sendServiceViewChangeEvent(ServiceViewChangeEvent event) throws Exception;
}
